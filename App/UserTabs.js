import { StyleSheet, Text, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EmployeeListScreen from './Screens/EmployeeListScreen';
import EmployeeReportScreen from './Screens/EmployeeReportScreen';
import HomeScreen from './Screens/HomeScreen';
import SettingsScreen from './Screens/SettingsScreen';
import ShiftReportScreen from './Screens/ShiftReportScreen';
import Logo from './Screens/Logo';
import { auth, db } from './firebase';
import { getDoc, doc } from 'firebase/firestore';

const Tab = createBottomTabNavigator();

const UserTabs = () => {
    const UID = auth.currentUser.uid;
    const [role, setRole] = useState('');

    useEffect(() => {
        const fetchRole = async () => {
            //console.log("Fetching Role");
            try {
                // Directly access the user's document using their UID
                const userDocRef = doc(db, 'users2', UID);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setRole(userData.role);
                    //console.log("Role:", userData.role);
                } else {
                    console.log("No such document!");
                }
            } catch (e) {
                console.error("Error Fetching Role", e);
            }
            console.log("Finished fetching role");
        };
        fetchRole();
    }, [UID]);

    return (
        <Tab.Navigator
            initialRouteName='Home'
            screenOptions={({ route }) => ({
                tabBarStyle: { paddingBottom: 10, height: 70, paddingTop: 10 },
                headerStyle: {
                    backgroundColor: '#363836', // Set the background color of the header to black
                },
                headerTintColor: 'white', // Set the text color of the header to white
                headerRight: () => <Logo />,
                headerTitleAlign: 'left', // Align the header title to the left
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    let iconSize = focused ? size * 1.2 : size * 0.9; // Increase icon size when focused

                    switch (route.name) {
                        case 'Manager Home':
                            iconName = 'home';
                            break;
                        case 'Employee List':
                            iconName = 'analytics';
                            break;
                        case 'My Shifts':
                            iconName = 'cash';
                            break;
                        case 'Settings':
                            iconName = 'settings';
                            break;
                        default:
                            iconName = 'home';
                    }

                    return <Ionicons name={iconName} size={iconSize} color={color} />;
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: 'bold',
                },
                tabBarActiveTintColor: 'black',
                tabBarInactiveTintColor: 'grey',
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
            />
            {role === "employer" && (
                <Tab.Screen
                    name="Employee List"
                    component={EmployeeListScreen}
                />
            )}
            <Tab.Screen
                name="My Shifts"
                component={ShiftReportScreen}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
            />
        </Tab.Navigator>
    );
};

export default UserTabs;
