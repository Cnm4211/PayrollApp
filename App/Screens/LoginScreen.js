import React, { useState, useEffect } from 'react'; 
import { KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase';
import { useNavigation, useFocusEffect} from '@react-navigation/native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import Logo from './Logo';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useNavigation();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                fetchUserData(user.uid);
            }
        });
        return unsubscribe;
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            setEmail('');
            setPassword('');
        }, [])
    );

    const fetchUserData = async (uid) => {
        try {
            const userDocRef = doc(db, 'users2', uid);
            const userDoc = await getDoc(userDocRef);
    
            if (userDoc.exists()) {
                const userData = userDoc.data();
                await AsyncStorage.setItem('userData', JSON.stringify(userData));
                navigation.navigate("MainTabs", {
                    screen: "Home",
                    params: { email: userData.email }
                });
            } else {
                console.error('User document does not exist');
                // Handle case where user document is missing
                Alert.alert('Error', 'User data not found');
            }
        } catch (e) {
            console.error("Error fetching user data: ", e);
            
        }
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSignUp = async () => {
        if (!validateEmail(email)) {
            alert("Please enter a valid email address.");
            return;
        }
        if (password.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }
        try {
            const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredentials.user;
    
            const userData = {
                email: user.email,
                username: email,
                password: password,
                role: 'employee',
                clockedIn: false,
                atLunch: false,
                currentShift: null,
                shifts: []
            };
    
            await setDoc(doc(db, 'users2', user.uid), userData);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            fetchUserData(user.uid);
        } catch (error) {
            console.error('Sign up error:', error);
            alert(error.message);
        }
    };

    const handleLogIn = () => {
        if (!validateEmail(email)) {
            alert("Please enter a valid email address.");
            return;
        }
        signInWithEmailAndPassword(auth, email, password)
            .then(userCredentials => {
                const user = userCredentials.user;
                console.log('Logged in with:', user.email);
                fetchUserData(user.uid);
            })
            .catch(error => alert(error.message));
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior='padding'>
            <View>
                <Logo></Logo>
            </View>
            <View style={styles.inputContainer}>
                <TextInput
                    placeholder='Email'
                    value={email}
                    onChangeText={text => setEmail(text)}
                    style={styles.input}
                    keyboardType='email-address'
                />
                <TextInput
                    placeholder='Password'
                    value={password}
                    onChangeText={text => setPassword(text)}
                    style={styles.input}
                    secureTextEntry
                />
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={handleLogIn} style={styles.button}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSignUp} style={[styles.button, styles.buttonOutline]}>
                    <Text style={styles.buttonOutlineText}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
    },
    inputContainer: {
        width: '80%'
    },
    input: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 5
    },
    buttonContainer: {
        width: '60%',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40
    },
    button: {
        backgroundColor: '#0782F9',
        width: '100%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center'
    },
    buttonOutline: {
        backgroundColor: 'white',
        marginTop: 5,
        borderColor: '#0782F9',
        borderWidth: 2
    },
    buttonOutlineText: {
        color: '#0782F9',
        fontWeight: '700',
        fontSize: 16
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16
    }
});
