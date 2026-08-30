import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pkg = 'br/com/sobrevivencia/central';
const javaDir = path.join(root, 'android/app/src/main/java', pkg);

fs.mkdirSync(javaDir, { recursive: true });

const plugin = fs.readFileSync(path.join(root, 'CentralBridgePlugin.java.txt'), 'utf8');
fs.writeFileSync(path.join(javaDir, 'CentralBridgePlugin.java'), plugin);
const accessibilityService = fs.readFileSync(path.join(root, 'CentralAccessibilityService.java.txt'), 'utf8');
fs.writeFileSync(path.join(javaDir, 'CentralAccessibilityService.java'), accessibilityService);

const main = path.join(javaDir, 'MainActivity.java');
fs.writeFileSync(main, `package br.com.sobrevivencia.central;

import android.graphics.Color;
import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(CentralBridgePlugin.class);
    super.onCreate(savedInstanceState);
    WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    getWindow().setStatusBarColor(Color.BLACK);
    getWindow().setNavigationBarColor(Color.BLACK);
  }
}
`);

const manifest = path.join(root, 'android/app/src/main/AndroidManifest.xml');
const accessibilityXmlDir = path.join(root, 'android/app/src/main/res/xml');
fs.mkdirSync(accessibilityXmlDir, { recursive: true });
const accessibilityXml = `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeWindowStateChanged|typeWindowsChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:notificationTimeout="100"
    android:canRetrieveWindowContent="false"
    android:accessibilityFlags="flagDefault"
    android:isAccessibilityTool="false" />`;
fs.writeFileSync(path.join(accessibilityXmlDir, 'central_accessibility_service.xml'), accessibilityXml);

const launcherDir = path.join(root, 'android/app/src/main/res/drawable-nodpi');
fs.mkdirSync(launcherDir, { recursive: true });
fs.copyFileSync(path.join(root, 'icone.png'), path.join(launcherDir, 'launchericon.png'));

let xml = fs.readFileSync(manifest, 'utf8');
const locationPermissions = `<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />`;

if (!xml.includes('android.permission.ACCESS_COARSE_LOCATION')) {
  xml = xml.replace(/<manifest([^>]*)>/, `<manifest$1>\n${locationPermissions}`);
}

const queries = `<queries>
  <package android:name="com.mapswithme.maps.pro" />
  <package android:name="com.trailbehind.android.gaiagps.pro" />
  <package android:name="com.geeksville.mesh" />
  <package android:name="com.bitchat.droid" />
  <package android:name="org.kiwix.kiwixmobile" />
  <package android:name="org.kiwix.kiwixmobile.standalone" />
  <package android:name="com.google.android.apps.translate" />
  <package android:name="com.pocketpalai" />
  <intent><action android:name="android.media.action.IMAGE_CAPTURE" /></intent>
  <intent><action android:name="android.provider.MediaStore.RECORD_SOUND" /></intent>
</queries>`;

if (!xml.includes('<queries>')) {
  xml = xml.replace(/<manifest([^>]*)>/, `<manifest$1>\n${queries}`);
}

xml = xml
  .replace(/\sandroid:icon="[^"]*"/g, '')
  .replace(/\sandroid:roundIcon="[^"]*"/g, '')
  .replace(/<application\b([^>]*)>/, '<application$1 android:icon="@drawable/launchericon" android:roundIcon="@drawable/launchericon">');


const accessibilityServiceDeclaration = `
        <service
            android:name=".CentralAccessibilityService"
            android:label="Diagnóstico da Sobrevivência Central"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/central_accessibility_service" />
        </service>`;

if (!xml.includes('android:name=".CentralAccessibilityService"')) {
  xml = xml.replace('</application>', `${accessibilityServiceDeclaration}
    </application>`);
}

fs.writeFileSync(manifest, xml);

const gradle = path.join(root, 'android/app/build.gradle');
if (fs.existsSync(gradle)) {
  let g = fs.readFileSync(gradle, 'utf8');
  g = g
    .replace(/versionCode\s+\d+/, 'versionCode 40100')
    .replace(/versionName\s+"[^"]+"/, 'versionName "4.1.0"');

  const ks = process.env.ANDROID_KEYSTORE_PATH;
  const storePass = process.env.ANDROID_KEYSTORE_PASSWORD;
  const keyAlias = process.env.ANDROID_KEY_ALIAS;
  const keyPass = process.env.ANDROID_KEY_PASSWORD;

  if (ks && storePass && keyAlias && keyPass && !g.includes('centralRelease')) {
    const esc = (v) => String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const signing = `
    signingConfigs {
        centralRelease {
            storeFile file('${esc(ks)}')
            storePassword '${esc(storePass)}'
            keyAlias '${esc(keyAlias)}'
            keyPassword '${esc(keyPass)}'
        }
    }
`;
    g = g.replace(/\n\s*buildTypes\s*\{/, signing + '\n    buildTypes {');
    g = g.replace(/release\s*\{/, `release {\n            signingConfig signingConfigs.centralRelease`);
  }

  fs.writeFileSync(gradle, g);
}

console.log('Android nativo preparado');
