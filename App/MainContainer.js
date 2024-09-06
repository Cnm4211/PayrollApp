import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserTabs from './UserTabs';
import LoginScreen from './Screens/LoginScreen';
import EmployeeReportScreen from './Screens/EmployeeReportScreen';


const Stack = createNativeStackNavigator();

const MainContainer = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName='LoginScreen'>
                <Stack.Screen
                    name="LoginScreen"
                    component={LoginScreen}
                    options={{ headerShown: false }}
                />

                <Stack.Screen
                    name="MainTabs"
                    component={UserTabs}
                    options={{ headerShown: false }}
                />

                <Stack.Screen
                    name="Employee Reports"
                    component={EmployeeReportScreen}
                    options={{
                        headerStyle: { backgroundColor: '#363836' },
                        headerTintColor: '#fff', // Set the text color to white for contrast
                    }}
                    
                />
            </Stack.Navigator>
        </NavigationContainer>

    )
}

export default MainContainer

const styles = StyleSheet.create({})