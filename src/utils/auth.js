import AsyncStorage from '@react-native-async-storage/async-storage';

export const checkAuth = async () => {
  try {
    const user = await AsyncStorage.getItem('userToken');
    return !!user;
  } catch (error) {
    console.error('Грешка при проверка на потребителя:', error);
    return false;
  }
};