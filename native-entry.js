import { registerPlugin, Capacitor } from '@capacitor/core';
const plugin = registerPlugin('CentralBridge');
window.NativeCentral = { isNative: Capacitor.isNativePlatform(), platform: Capacitor.getPlatform(), plugin };
