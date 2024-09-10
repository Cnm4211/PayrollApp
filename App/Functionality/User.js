import { firestore } from './firebaseConfig'; 
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

class User {
    constructor(username, password, role) {
        this.username = username;
        this.password = password;
        this.role = role;
        this.clockedIn = false;
        this.atLunch = false;
        this.currentShift = null;
    }

    static async createUser(username, password, role) {
        try {
            const userRef = doc(firestore, 'users2', username);
            await setDoc(userRef, {
                password: password,
                role: role,
                clockedIn: false,
                atLunch: false,
                currentShift: null,
                shifts: []
            });
        } catch (e) {
            console.error("Error creating user: ", e);
            throw e;
        }
    }

    static async getUser(username) {
        try {
            const userRef = doc(firestore, 'users2', username);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const user = new User(username, userData.password, userData.role);
                user.clockedIn = userData.clockedIn;
                user.atLunch = userData.atLunch;
                user.currentShift = userData.currentShift;
                return user;
            } else {
                throw new Error("User does not exist");
            }
        } catch (e) {
            console.error("Error fetching user: ", e);
            throw e;
        }
    }

    async clockIn(clockInTime) {
        if (this.clockedIn) throw new Error("User is already clocked in");

        this.clockedIn = true;
        this.currentShift = {
            clockIn: clockInTime,
            clockOut: null,
            lunchBreaks: [],
        };

        try {
            const userRef = doc(firestore, 'users2', this.username);
            await updateDoc(userRef, {
                clockedIn: true,
                currentShift: this.currentShift,
            });
        } catch (e) {
            console.error("Error updating clock-in: ", e);
            throw e;
        }
    }

    async clockOut(clockOutTime) {
        if (!this.clockedIn) throw new Error("User is not clocked in");

        this.clockedIn = false;
        this.currentShift.clockOut = clockOutTime;

        try {
            const userRef = doc(firestore, 'users2', this.username);
            await updateDoc(userRef, {
                clockedIn: false,
                currentShift: null,
                shifts: arrayUnion(this.currentShift),
            });
        } catch (e) {
            console.error("Error updating clock-out: ", e);
            throw e;
        }
    }

    async lunchIn(lunchInTime) {
        if (!this.clockedIn || this.atLunch) throw new Error("User is not clocked in or already at lunch");

        this.atLunch = true;

        try {
            this.currentShift.lunchBreaks.push({ start: lunchInTime });
            const userRef = doc(firestore, 'users2', this.username);
            await updateDoc(userRef, {
                atLunch: true,
                currentShift: this.currentShift,
            });
        } catch (e) {
            console.error("Error starting lunch: ", e);
            throw e;
        }
    }

    async lunchOut(lunchOutTime) {
        if (!this.atLunch) throw new Error("User is not at lunch");

        this.atLunch = false;

        try {
            const lastLunchBreak = this.currentShift.lunchBreaks[this.currentShift.lunchBreaks.length - 1];
            lastLunchBreak.end = lunchOutTime;
            const userRef = doc(firestore, 'users2', this.username);
            await updateDoc(userRef, {
                atLunch: false,
                currentShift: this.currentShift,
            });
        } catch (e) {
            console.error("Error ending lunch: ", e);
            throw e;
        }
    }
}

export default User;
