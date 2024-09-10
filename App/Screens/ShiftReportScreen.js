import { StyleSheet, Text, View, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, doc, getDocs, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';

const formatDate = (date) => {
  if (date) {
    return format(date, 'yyyy-MM-dd');
  }
  return 'N/A';
};

const formatTime = (date) => {
  if (date) {
    return format(date, 'hh:mm a');
  }
  return 'N/A';
};

const calculateHoursWorked = (shift) => {
  if (!shift || !shift.clockIn) {
    console.error("Invalid shift data provided.");
    return "N/A";
  }

  if (!shift.clockOut) {
    const now = new Date();
    shift.clockOut = now;
    //console.log("Was missing clock out, now has clock out of", now);
  }

  const clockInTime = shift.clockIn.getTime();
  const clockOutTime = shift.clockOut.getTime();
  let totalHours = (clockOutTime - clockInTime) / 1000 / 3600;

  if (shift.lunchIn && shift.lunchOut) {
    const lunchInTime = shift.lunchIn.getTime();
    const lunchOutTime = shift.lunchOut.getTime();
    const lunchDuration = (lunchOutTime - lunchInTime) / 1000 / 3600;
    totalHours -= lunchDuration;
  }

  return totalHours.toFixed(2);
};

const ShiftReportScreen = () => {
  const UID = auth.currentUser.uid;
  const [completedShifts, setCompletedShifts] = useState([]);

  useEffect(() => {
    const fetchShifts = () => {
      try {
        // Directly access the user's document using their UID
        const userDocRef = doc(db, 'users2', UID);

        // Set up a real-time listener for the user's document
        const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();

            // Check if shifts array exists and is valid
            if (userData.shifts && Array.isArray(userData.shifts)) {
              const shifts = userData.shifts.map(shift => ({
                ...shift,
                clockIn: shift.clockIn ? shift.clockIn.toDate() : null,
                clockOut: shift.clockOut ? shift.clockOut.toDate() : null,
                lunchIn: shift.lunchIn ? shift.lunchIn.toDate() : null,
                lunchOut: shift.lunchOut ? shift.lunchOut.toDate() : null,
              }));

              setCompletedShifts(shifts);
            } else {
              console.warn("No shifts array found or it is not an array.");
            }
          } else {
            console.warn("No such document!");
          }
        });

        // Clean up the listener when the component unmounts
        return () => unsubscribe();

      } catch (e) {
        console.error("Error Fetching Shifts", e);
      }
    };

    fetchShifts();
  }, [UID]);


  const weeklyHours = () => {
    let sum = 0;
    for (let i = 0; i < completedShifts.length; i++) {
      sum += parseFloat(calculateHoursWorked(completedShifts[i]));
    }
    return parseFloat(sum.toFixed(2));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subHeader}>Completed Shifts</Text>
      <Text style={[styles.boldText, {marginBottom:20, marginLeft:-4, fontSize: 22}]}> Total Hours: {weeklyHours()} Hours</Text> 
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {completedShifts.length > 0 ? (
          completedShifts.map((shift, index) => (
            <View key={index} style={styles.shiftBox}>
              <Text style={styles.dateHeader}>{shift.clockIn.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</Text>
              <View style={styles.shiftDetails}>
                <Text style={styles.boxText}><Text style={styles.boldText}>Clocked In:</Text> {formatTime(shift.clockIn)}</Text>
                <Text style={styles.boxText}><Text style={styles.boldText}>Clocked Out:</Text> {formatTime(shift.clockOut)}</Text>
                <Text style={styles.boxText}><Text style={styles.boldText}>Lunch In:</Text> {formatTime(shift.lunchIn)}</Text>
                <Text style={styles.boxText}><Text style={styles.boldText}>Lunch Out:</Text> {formatTime(shift.lunchOut)}</Text>
                <Text style={styles.boxText}><Text style={styles.boldText}>Total Hours Worked:</Text> {calculateHoursWorked(shift)}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.boxText}>No completed shifts</Text>
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
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  subHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'top',
  },
  shiftBox: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  shiftDetails: {
    marginTop: 8,
  },
  boxText: {
    fontSize: 16,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
  currentShiftContainer: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#e1f5fe',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  currentShiftHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  currentShiftDetails: {
    marginTop: 8,
  },
});

export default ShiftReportScreen;
