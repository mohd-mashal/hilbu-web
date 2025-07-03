let storage: any = null;

if (typeof window === 'undefined') {
  // Server-side: disable storage
  storage = null;
} else {
  try {
    // Only load AsyncStorage if available (mobile)
    storage = require('@react-native-async-storage/async-storage').default;
  } catch (e) {
    // On web, ignore it
    storage = {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    };
  }
}

export default storage;
