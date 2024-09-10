import { collection, addDoc, doc, updateDoc, getDocs, getDoc, query, where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';


class Shift {
  constructor(username, clockIn, clockOut = null, lunchIn = null, lunchOut = null) {
    this.username = username;
    this.clockIn = clockIn;
    this.clockOut = clockOut;
    this.lunchIn = lunchIn;
    this.lunchOut = lunchOut;
  }

  static getStartOfWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const difference = (dayOfWeek + 6) % 7; // Days since Sunday
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - difference);
    startOfWeek.setHours(0, 0, 0, 0); // Set time to midnight
    return startOfWeek;
  }

  static async createShift(uid, clockIn) {
    try {
      const userRef = doc(db, 'users2', uid);
      const userSnap = await getDoc(userRef);
      let currentShifts = userSnap.data().shifts || [];

      const now = new Date();
      let lastResetDate = userSnap.data().lastResetDate?.toDate();

      if (!lastResetDate) {
        // If lastResetDate doesn't exist, set it to the start of the current week
        lastResetDate = this.getStartOfWeek();
      }

      // Check if we need to reset shifts
      if (now >= this.getStartOfWeek() && lastResetDate < this.getStartOfWeek()) {
        currentShifts = []; // Reset the shifts array
        lastResetDate = this.getStartOfWeek();
      }

      if (currentShifts.length >= 7) {
        currentShifts.shift();
      }

      // Create a new shift object
      const newShift = {
        clockIn: clockIn,
        clockOut: null,
        lunchIn: null,
        lunchOut: null,
      };

      currentShifts.push(newShift);

      // Update the user document with the new shift and lastResetDate
      await updateDoc(userRef, {
        shifts: currentShifts,
        lastResetDate: lastResetDate
      });

      return newShift;
    } catch (e) {
      console.error("Error creating shift: ", e);
      throw e;
    }
  }

  static async updateShift(uid, clockIn, updates) {
    try {
      const userRef = doc(db, 'users2', uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      // Find the shift that needs to be updated
      const shiftToUpdate = userData.shifts[userData.shifts.length - 1];

      if (!shiftToUpdate) {
        throw new Error("Shift not found.");
      }

      // Remove the old shift from the array
      await updateDoc(userRef, {
        shifts: arrayRemove(shiftToUpdate),
      });

      // Add the updated shift to the array
      const updatedShift = { ...shiftToUpdate, ...updates };
      await updateDoc(userRef, {
        shifts: arrayUnion(updatedShift),
      });

    } catch (e) {
      console.error("Error updating shift: ", e);
      throw e;
    }
  }

  static async getCompletedShifts(uid) {
    try {
      const userRef = doc(db, 'users2', uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      // Filter completed shifts where clockOut is not null
      const completedShifts = userData.shifts.filter(shift => shift.clockOut !== null);

      return completedShifts;
    } catch (e) {
      console.error("Error getting completed shifts: ", e);
      throw e;
    }
  }

  static async getLastReset() {
    if (!this.lastResetDate) {
      const storedDate = await AsyncStorage.getItem('lastResetDate');
      this.lastResetDate = storedDate ? new Date(JSON.parse(storedDate)) : this.getStartOfWeek();
    }
    return this.lastResetDate;
  }
}



export default Shift;