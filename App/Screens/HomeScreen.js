import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { auth, db } from '../firebase';
import { doc, updateDoc, arrayUnion, getDoc, collection, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Shift from '../Functionality/Shift';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';

const HomeScreen = () => {
    const [userData, setUserData] = useState(null);
    const [clockedIn, setClockedIn] = useState(false);
    const [atLunch, setAtLunch] = useState(false);
    const [timerVisible, setTimerVisible] = useState(false);
    const [lunchStartTime, setLunchStartTime] = useState(null);
    const [lunchButtonVisible, setLunchButtonVisible] = useState(false);
    const [documentId, setDocumentId] = useState(null);
    const [currentShift, setCurrentShift] = useState(null);
    const [lastShift, setLastShift] = useState(null);
    const [shifts, setShifts] = useState([]);
    const [remainingLunchTime, setRemainingLunchTime] = useState(0);
    const intervalId = useRef(null);
    const [hasBeenToLunch, setHasBeenToLunch] = useState(false);

    const UID = auth.currentUser.uid;
    const navigation = useNavigation();

    const fetchShifts = async () => {
        try {
            const userDocRef = doc(db, 'users2', UID);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const shiftsArray = userData.shifts || [];

                // Convert Firestore Timestamps to JavaScript Date objects
                const formattedShifts = shiftsArray.map(shift => ({
                    ...shift,
                    clockIn: shift.clockIn ? shift.clockIn.toDate() : null,
                    clockOut: shift.clockOut ? shift.clockOut.toDate() : null,
                    lunchIn: shift.lunchIn ? shift.lunchIn.toDate() : null,
                    lunchOut: shift.lunchOut ? shift.lunchOut.toDate() : null,
                }));

                setShifts(formattedShifts);
                if (formattedShifts.length > 0) {
                    const sortedShifts = formattedShifts.sort((a, b) => b.clockIn - a.clockIn);
                    const recentShift = sortedShifts[0];

                    if (recentShift.clockOut && recentShift.clockIn) {
                        setLastShift(recentShift);
                    }
                } else {
                    console.log("No shifts found"); // Log if no shifts are found
                }
            } else {
                console.log("User document not found"); 
            }
        } catch (e) {
            console.error("Error Fetching Shifts", e);
        }
        //console.log("Finished fetching shifts");
    };

    useEffect(() => {
        fetchShifts();
    }, []);

    useEffect(() => {
        const fetchStoredData = async () => {
            try {
                const storedClockedIn = await AsyncStorage.getItem('clockedIn');
                const storedAtLunch = await AsyncStorage.getItem('atLunch');
                const storedCurrentShift = await AsyncStorage.getItem('currentShift');
                const storedLunchStartTime = await AsyncStorage.getItem('lunchStart');

                if (storedClockedIn !== null) {
                    setClockedIn(JSON.parse(storedClockedIn));
                }

                if (storedAtLunch !== null) {
                    setAtLunch(JSON.parse(storedAtLunch));
                    setTimerVisible(JSON.parse(storedAtLunch));
                }

                if (storedCurrentShift) {
                    const parsedShift = JSON.parse(storedCurrentShift);
                    setCurrentShift({
                        clockIn: parsedShift.clockIn ? new Date(parsedShift.clockIn) : null,
                        clockOut: parsedShift.clockOut ? new Date(parsedShift.clockOut) : null,
                        lunchIn: parsedShift.lunchIn ? new Date(parsedShift.lunchIn) : null,
                        lunchOut: parsedShift.lunchOut ? new Date(parsedShift.lunchOut) : null,
                    });
                }

                if (storedLunchStartTime) {
                    setLunchStartTime(new Date(JSON.parse(storedLunchStartTime)));
                }

                const storedHasBeenToLunch = await AsyncStorage.getItem('hasBeenToLunch');
                if (storedHasBeenToLunch !== null) {
                    setHasBeenToLunch(JSON.parse(storedHasBeenToLunch));
                }

                setLunchButtonVisible(JSON.parse(storedClockedIn) && !JSON.parse(storedAtLunch));

            } catch (e) {
                console.error("Error retrieving stored data: ", e);
                Alert.alert('Error', 'Error retrieving stored data');
            }
        };

        const fetchUserDataFromFirestore = async () => {
            try {
                if (!documentId) {
                    setDocumentId(UID);
                }
                const userDocRef = doc(db, 'users2', UID);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserData(userData);

                    if (userData.clockedIn != undefined) {
                        setClockedIn(userData.clockedIn);
                    }

                    if (userData.atLunch != undefined) {
                        setAtLunch(userData.atLunch);
                        setTimerVisible(userData.atLunch);
                    }

                    if (userData.currentShift) {
                        const currentShiftData = {
                            clockIn: userData.currentShift.clockIn ? userData.currentShift.clockIn.toDate() : null,
                            clockOut: userData.currentShift.clockOut ? userData.currentShift.clockOut.toDate() : null,
                            lunchIn: userData.currentShift.lunchIn ? userData.currentShift.lunchIn.toDate() : null,
                            lunchOut: userData.currentShift.lunchOut ? userData.currentShift.lunchOut.toDate() : null,
                        };
                        setCurrentShift(currentShiftData);
                    }

                    setLunchButtonVisible(userData.clockedIn && !userData.atLunch);

                } else {
                    console.error('User document not found');
                }
            } catch (e) {
                console.error("Error retrieving user data from Firestore: ", e);
                Alert.alert('Error', 'Error retrieving user data from Firestore');
            }
        };

        fetchStoredData();
        fetchUserDataFromFirestore();
    }, []);

    useEffect(() => {
        const asyncSetUserData = () => {
            if (userData) {
                AsyncStorage.setItem('userData', JSON.stringify(userData));
            }
        }
        asyncSetUserData();
    }, [userData]);

    const formatClockTime = (date) => {
        if (date) {
            return format(date, 'hh:mm a');
        }
        return 'N/A';
    };

    useEffect(() => {
        if (atLunch && lunchStartTime) {
            const targetTime = new Date(lunchStartTime.getTime() + 3599999);
            intervalId.current = setInterval(() => {
                const now = new Date();
                const timeLeft = Math.max(0, Math.floor((targetTime - now) / 1000));
                setRemainingLunchTime(timeLeft);

                if (timeLeft <= 0) {
                    clearInterval(intervalId.current);
                    setTimerVisible(false);
                }
            }, 1000);

        } else {
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
        }
        return () => {
            if (intervalId.current) {
                clearInterval(intervalId.current);
                intervalId.current = null;
            }
        };
    }, [atLunch, lunchStartTime]);


    const getRemainingLunchTime = () => {
        const minutes = Math.floor(remainingLunchTime / 60);
        const seconds = remainingLunchTime % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const showToast = (type, message) => {
        Toast.show({
            type: type,
            text1: message,
            position: 'bottom',
            visibilityTime: 2000,
        });
    };

    const updateUserField = async (uid, field, value) => {
        if (!documentId) {
            setDocumentId(uid);
        } else {
            try {
                const userDocRef = doc(db, 'users2', documentId);
                await updateDoc(userDocRef, { [field]: value });

                const updatedUserData = { ...userData, [field]: value };
                setUserData(updatedUserData);
                await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
            } catch (e) {
                console.error(`Error updating ${field}: `, e);
                showToast('error', `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} update failed`);
            }
        }
    }

    const handleClockIn = async () => {
        if (!clockedIn) {
            try {
                const clockInTime = new Date();
                const currentShift = await Shift.createShift(UID, clockInTime);
                setCurrentShift(currentShift);

                await AsyncStorage.setItem('currentShift', JSON.stringify(currentShift));
                await updateUserField(UID, 'clockedIn', true);
                await updateUserField(UID, 'currentShift', currentShift);

                showToast('success', 'Clocked in successfully');
                setClockedIn(true);
                setLunchButtonVisible(true);

                await AsyncStorage.setItem('clockedIn', JSON.stringify(true));
                await AsyncStorage.setItem('clockIn', JSON.stringify(clockInTime));
            } catch (error) {
                console.error('Error handling clock-in:', error);
                showToast('error', 'Failed to clock in');
            }
        } else {
            showToast('info', 'Already clocked in');
        }
    };
    const handleClockOut = async () => {
        if (clockedIn) {
            Alert.alert('Confirm Clock Out', 'Are you sure you want to clock out?', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'OK',
                    onPress: async () => {
                        try {
                            const clockOutTime = new Date();
                            const updatedShift = { ...currentShift, clockOut: clockOutTime };

                            await Shift.updateShift(UID, currentShift.clockIn, { clockOut: clockOutTime });
                            await AsyncStorage.setItem('clockOut', JSON.stringify(clockOutTime));
                            console.log("Passed updated shift");

                            await updateUserField(UID, 'clockedIn', false);
                            await updateUserField(UID, 'atLunch', false);
                            await updateUserField(UID, 'currentShift', null);

                            showToast('success', 'Clocked out successfully');
                            setClockedIn(false);
                            setAtLunch(false);
                            setLunchButtonVisible(false);
                            setTimerVisible(false);
                            setCurrentShift(updatedShift);
                            setHasBeenToLunch(false);
                            await AsyncStorage.setItem('hasBeenToLunch', JSON.stringify(false));
                            setLastShift(updatedShift);

                            await AsyncStorage.removeItem('clockedIn');
                            await AsyncStorage.removeItem('atLunch');
                            await AsyncStorage.removeItem('clockIn')
                            await AsyncStorage.removeItem('currentShift');

                            navigation.navigate("MainTabs", { screen: "My Shifts" });

                        } catch (error) {
                            console.error('Error handling clock-out:', error);
                            showToast('error', 'Failed to clock out');
                        }
                    },
                },
            ]);
        } else {
            showToast('info', 'Not clocked in');
        }
    };


    const handleLunchIn = async () => {
        if (clockedIn && !atLunch && !hasBeenToLunch) {
            try {
                //if (!currentShift) return;

                const lunchInTime = new Date();
                const updatedShift = { ...currentShift, lunchIn: new Date() };

                await Shift.updateShift(UID, currentShift.clockIn, { lunchIn: lunchInTime });

                setCurrentShift(updatedShift);
                setAtLunch(true);
                setLunchStartTime(lunchInTime);
                setTimerVisible(true);

                await updateUserField(UID, 'atLunch', true);

                await AsyncStorage.setItem('atLunch', JSON.stringify(true));
                await AsyncStorage.setItem('lunchStart', JSON.stringify(lunchInTime));
                await AsyncStorage.setItem('currentShift', JSON.stringify(updatedShift));

            } catch (e) {
                console.error('Error updating lunch in time: ', e);
                Alert.alert('Error', 'Failed to record lunch in time.');
            }
        }
    };


    const handleLunchOut = async () => {
        if (atLunch) {
            try {

                const lunchOutTime = new Date();
                const updatedShift = { ...currentShift, lunchOut: lunchOutTime };
                await Shift.updateShift(UID, currentShift.clockIn, { lunchOut: lunchOutTime })

                setCurrentShift(updatedShift);
                await updateUserField(UID, 'atLunch', false);

                setAtLunch(false);
                setTimerVisible(false);
                setRemainingLunchTime(0);
                setHasBeenToLunch(true);
                await AsyncStorage.setItem('atLunch', JSON.stringify(false));
                await AsyncStorage.setItem('lunchStart', JSON.stringify(null));
                await AsyncStorage.setItem('hasBeenToLunch', JSON.stringify(true));
                await AsyncStorage.setItem('currentShift', JSON.stringify(updatedShift));

            } catch (e) {
                console.error('Error updating lunch out time: ', e);
                Alert.alert('Error', 'Failed to record lunch out time.');
            }
        }
    };

    return (
        <View style={styles.container}>
            <Text style={{ fontSize: 24, color: 'black', textAlign: 'center', fontWeight: 'bold', }}>
                {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                })}</Text>
            <View style={styles.gap}></View>
            <View style={styles.box}>
                <Text style={{ fontSize: 20, textAlign: 'left', fontWeight: "bold" }}>Last Clock Out:</Text>
                <Text style={[styles.shiftDetail, { marginLeft: 30 }]}>{lastShift ?
                    lastShift.clockOut?.toLocaleString('en-US',
                        {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                        }) : (clockedIn ? "Currently Clocked In" : "N/A")}</Text>
            </View>
            <View style={styles.gap}></View>
            <Text style={styles.title}>Home Screen</Text>
            <View style={styles.buttonContainer}>
                {!clockedIn ? (
                    <TouchableOpacity style={styles.button} onPress={handleClockIn}>
                        <Text style={styles.buttonText}>Clock In</Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        <TouchableOpacity style={styles.button} onPress={handleClockOut}>
                            <Text style={styles.buttonText}>Clock Out</Text>
                        </TouchableOpacity>

                        {!hasBeenToLunch && (
                            <>
                                {!atLunch ? (
                                    <TouchableOpacity style={styles.button} onPress={handleLunchIn}>
                                        <Text style={styles.buttonText}>Lunch In</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity style={styles.button} onPress={handleLunchOut}>
                                        <Text style={styles.buttonText}>Lunch Out</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </>
                )}
            </View>

            {
                clockedIn && currentShift && (
                    <View style={styles.box}>
                        <Text style={styles.currentShiftTitle}>Current Shift</Text>
                        <Text style={styles.shiftDetail}>Clock In: {formatClockTime(currentShift.clockIn)}</Text>
                        <Text style={styles.shiftDetail}>Lunch In: {formatClockTime(currentShift.lunchIn)}</Text>
                        <Text style={styles.shiftDetail}>Lunch Out: {formatClockTime(currentShift.lunchOut)}</Text>
                    </View>
                )
            }
            {
                timerVisible && (
                    <View style={styles.timerContainer}>
                        <Text style={styles.timerText}>Lunch Time Remaining: {getRemainingLunchTime()} seconds</Text>
                    </View>
                )
            }
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#363836',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    currentShiftBox: {
        marginTop: 20,
        padding: 20,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
    },
    currentShiftTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    shiftDetail: {
        fontSize: 16,
        marginBottom: 5,
    },
    timerContainer: {
        marginTop: 20,
        padding: 20,
        borderRadius: 10,
        backgroundColor: '#FFE4B5',
    },
    timerText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    gap: {
        marginBottom: 50,
    },
    box: {
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
});

export default HomeScreen;