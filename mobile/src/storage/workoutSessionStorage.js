import AsyncStorage from "@react-native-async-storage/async-storage";

const keyForUser = (userId) => `active-workout-session:${userId}`;

let writeQueue = Promise.resolve();

const enqueueWrite = (operation) => {
  const result = writeQueue.then(operation);
  writeQueue = result.catch(() => {});
  return result;
};

export const workoutSessionStorage = {
  async load(userId) {
    if (!userId) return null;
    await writeQueue;
    const raw = await AsyncStorage.getItem(keyForUser(userId));
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn("[workout-session] saved session data is invalid:", error);
      await this.clear(userId);
      return null;
    }
  },

  save(userId, session) {
    if (!userId) return Promise.resolve();
    return enqueueWrite(() =>
      AsyncStorage.setItem(keyForUser(userId), JSON.stringify(session)),
    );
  },

  clear(userId) {
    if (!userId) return Promise.resolve();
    return enqueueWrite(() => AsyncStorage.removeItem(keyForUser(userId)));
  },
};
