import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),pkg='br/com/sobrevivencia/central',javaDir=path.join(root,'android/app/src/main/java',pkg);
fs.mkdirSync(javaDir,{recursive:true});
const plugin=fs.readFileSync(path.join(root,'CentralBridgePlugin.java.txt'),'utf8');
fs.writeFileSync(path.join(javaDir,'CentralBridgePlugin.java'),plugin);
const main=path.join(javaDir,'MainActivity.java');
fs.writeFileSync(main,`package br.com.sobrevivencia.central;\n\nimport android.os.Bundle;\nimport com.getcapacitor.BridgeActivity;\n\npublic class MainActivity extends BridgeActivity {\n  @Override\n  public void onCreate(Bundle savedInstanceState) {\n    registerPlugin(CentralBridgePlugin.class);\n    super.onCreate(savedInstanceState);\n  }\n}\n`);
const manifest=path.join(root,'android/app/src/main/AndroidManifest.xml');
let xml=fs.readFileSync(manifest,'utf8');
const queries=`<queries>
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
if(!xml.includes('<queries>'))xml=xml.replace(/<manifest([^>]*)>/,`<manifest$1>\n${queries}`);
fs.writeFileSync(manifest,xml);
const gradle=path.join(root,'android/app/build.gradle');
if(fs.existsSync(gradle)){
 let g=fs.readFileSync(gradle,'utf8');
 g=g.replace(/versionCode\s+\d+/,'versionCode 40000').replace(/versionName\s+"[^"]+"/,'versionName "4.0.0"');
 const ks=process.env.ANDROID_KEYSTORE_PATH,storePass=process.env.ANDROID_KEYSTORE_PASSWORD,keyAlias=process.env.ANDROID_KEY_ALIAS,keyPass=process.env.ANDROID_KEY_PASSWORD;
 if(ks&&storePass&&keyAlias&&keyPass&&!g.includes('centralRelease')){
   const esc=v=>String(v).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
   const signing=`\n    signingConfigs {\n        centralRelease {\n            storeFile file('${esc(ks)}')\n            storePassword '${esc(storePass)}'\n            keyAlias '${esc(keyAlias)}'\n            keyPassword '${esc(keyPass)}'\n        }\n    }\n`;
   g=g.replace(/\n\s*buildTypes\s*\{/,signing+'\n    buildTypes {');
   g=g.replace(/release\s*\{/,`release {\n            signingConfig signingConfigs.centralRelease`);
 }
 fs.writeFileSync(gradle,g);
}
console.log('Android nativo preparado');
