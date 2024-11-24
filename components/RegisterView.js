import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
  Platform,
} from 'react-native';
import { PropTypes } from 'prop-types';
import { useForm, Controller } from 'react-hook-form';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import styles from '../src/styles/RegisterStyles';

const RegisterView = ({ navigation }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const [containerPosition] = useState(new Animated.Value(0));

  // Handle keyboard animation
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      keyboardDidShow
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      keyboardDidHide
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const keyboardDidShow = (e) => {
    Animated.timing(containerPosition, {
      toValue: -e.endCoordinates.height / 1.1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const keyboardDidHide = () => {
    Animated.timing(containerPosition, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleRegister = async (data) => {
    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      Alert.alert('Успешна регистрация!');
      reset(); // Нулиране на формата след успешна регистрация
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Грешка при регистрация: ' + error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View style={{ transform: [{ translateY: containerPosition }] }}>
      {/* eslint-disable-next-line no-undef */}
      <Image source={require('../images/Дружинар.png')} style={styles.logo} />
      <Text style={styles.title}>Регистрация</Text>
        <View style={styles.inputContainer}>
          {/* Имейл */}
          <Controller
            control={control}
            name="email"
            rules={{
              required: 'Имейлът е задължителен.',
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: 'Моля, въведете валиден имейл адрес.',
              },
            }}
            render={({ field: { onChange, value } }) => (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Имейл"
                  value={value}
                  onChangeText={onChange}
                  placeholderTextColor="#242c0f"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
              </>
            )}
          />

          {/* Парола */}
          <Controller
            control={control}
            name="password"
            rules={{
              required: 'Паролата е задължителна.',
              minLength: {
                value: 6,
                message: 'Паролата трябва да бъде поне 6 символа.',
              },
            }}
            render={({ field: { onChange, value } }) => (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Парола"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  placeholderTextColor="#242c0f"
                />
                {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
              </>
            )}
          />

          {/* Потвърждение на парола */}
          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: 'Моля, потвърдете паролата.',
              validate: (value) => value === control._formValues.password || 'Паролите не съвпадат.',
            }}
            render={({ field: { onChange, value } }) => (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Въведете паролата отново"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  placeholderTextColor="#242c0f"
                />
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
                )}
              </>
            )}
          />

          {/* Бутон за регистрация */}
          <TouchableOpacity style={styles.button} onPress={handleSubmit(handleRegister)}>
            <Text style={styles.buttonText}>Регистрация</Text>
          </TouchableOpacity>

          <View style={styles.linkContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Вече имате акаунт?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

RegisterView.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default RegisterView;
