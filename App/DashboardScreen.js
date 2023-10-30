import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-community/async-storage';
import { useNavigation } from '@react-navigation/native';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        // If there's no token, navigate back to the login screen
        navigation.navigate('Login');
      } else {
        // If there is a token, make an authenticated request to get user data
        try {
          const response = await axios.get('http://localhost:3000/dashboard', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setUser(response.data);
        } catch (error) {
          console.error(error);
          // Handle authentication error here
          // Example: navigate to the login screen or show an error message
          navigation.navigate('Login');
        }
      }
    };

    checkToken();
  }, [navigation]);

  return (
    <View>
      <Text>Welcome to your dashboard!</Text>
      {user && <Text>Email: {user.email}</Text>}
    </View>
  );
};

export default DashboardScreen;

