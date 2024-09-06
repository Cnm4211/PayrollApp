import React, { useState, useEffect } from 'react'; 
import { View, Text, StyleSheet, TouchableOpacity, ToastAndroid } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {setEmail, setPassword } from './LoginScreen';



const showToast = (message) => {
  ToastAndroid.show(message, ToastAndroid.SHORT);
};

const logOut = async (navigation) => {
  showToast('Logged out successfully');
  navigation.navigate('LoginScreen');
};

const SettingsScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={[styles.subHeader, { textAlign: 'center' }]}>Log Out</Text>
        <TouchableOpacity
          style={styles.logOutButton}
          onPress={() => logOut(navigation)}  // Pass navigation here
        >
          <Text style={styles.logOutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
export default SettingsScreen

const styles = StyleSheet.create({
  subHeader: {
    fontWeight: 'bold',
    textAlign: 'center',
    paddingBottom: 30,
    fontSize: 30,
  },
  logOutButton: {
    backgroundColor: 'red',
    padding: 10,
    width: '36%',
    borderRadius: 5,
  },
  logOutButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gap: {
    margin: 10,
  },
  box: {
    width: '80%',
    alignItems: 'center',
  },
})
