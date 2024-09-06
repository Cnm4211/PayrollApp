import React from 'react'; 
import { Image, StyleSheet, View } from 'react-native';

const Logo = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/equalAutomotiveLogo-White.png')} // Update the path to your logo image
        style={styles.logo}
        resizeMode="contain" // Adjust this based on how you want the image to fit
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 110, // Adjust based on your needs
    height: 100, // Adjust based on your needs
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20, // Adjust as needed
  },
  logo: {
    width: 140,
    height: 100,
  },
});

export default Logo;