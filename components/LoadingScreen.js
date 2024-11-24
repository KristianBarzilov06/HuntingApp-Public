import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { PropTypes } from 'prop-types';
import { checkAuth } from '../src/utils/auth';
import { loadFonts } from '../src/utils/loadResources';

const LoadingScreen = ({ navigation }) => {
  useEffect(() => {
    const loadResourcesAndNavigate = async () => {
      try {
        await loadFonts();
        const isLoggedIn = await checkAuth();

        navigation.replace(isLoggedIn ? 'Main' : 'Login');
      } catch (error) {
        console.error('Грешка при зареждане на ресурси:', error);
      }
    };

    loadResourcesAndNavigate();
  }, [navigation]);

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#6A7845" />
    </View>
  );
};

LoadingScreen.propTypes = {
  navigation: PropTypes.shape({
    replace: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
});

export default LoadingScreen;