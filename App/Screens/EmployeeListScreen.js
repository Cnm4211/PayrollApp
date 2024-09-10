import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';


const EmployeeListScreen = ({ navigation }) => {
  const [employeeDict, setEmployeeDict] = useState({});

  useEffect(() => {
    const fetchEmployees = async () => {
      const q = query(collection(db, 'users2'));
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const newEmployeeDict = {};

        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data();
          const recentShift = await fetchShifts(docSnapshot.id);
          newEmployeeDict[docSnapshot.id] = {
            data: data,             // Store the employee data
            recentShift: recentShift, // Store the recent shift
          };
        }

        setEmployeeDict(newEmployeeDict);
      });

      return () => unsubscribe();
    };

    fetchEmployees();
  }, []);

  const fetchShifts = async (UID) => {
    try {
      const userDocRef = doc(db, 'users2', UID);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const shiftsArray = userData.shifts || [];

        const formattedShifts = shiftsArray.map(shift => ({
          ...shift,
          clockIn: shift.clockIn ? shift.clockIn.toDate() : null,
          clockOut: shift.clockOut ? shift.clockOut.toDate() : null,
          lunchIn: shift.lunchIn ? shift.lunchIn.toDate() : null,
          lunchOut: shift.lunchOut ? shift.lunchOut.toDate() : null,
        }));

        if (formattedShifts.length > 0) {
          const sortedShifts = formattedShifts.sort((a, b) => b.clockIn - a.clockIn);
          return sortedShifts[0]; // Return the most recent shift
        } else {
          console.log("No shifts found");
          return null; // Return null if no shifts are found
        }
      } else {
        console.log("User document not found");
        return null; // Return null if user document is not found
      }
    } catch (e) {
      console.error("Error Fetching Shifts", e);
      return null; // Return null if there's an error
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {Object.entries(employeeDict).length > 0 ? (
          Object.entries(employeeDict).map(([id, { data, recentShift }], index) => (
            <TouchableOpacity
              key={index}
              style={styles.item}
              onPress={() => navigation.navigate('Employee Reports', { user: id })}
            >
              <Text style={styles.username}>{data.username}</Text>
              <Text style={styles.clockIn}>
                Last Clock In: {recentShift && recentShift.clockIn ? new Date(recentShift.clockIn).toLocaleString() : 'N/A'}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.boxText}>No employees found</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  item: {
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
  username: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clockIn: {
    fontSize: 14,
    color: '#555',
  },
});

export default EmployeeListScreen;