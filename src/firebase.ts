import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  limit,
  writeBatch
} from "firebase/firestore";
import firebaseConfigJson from "../firebase-applet-config.json";

// Initialize Firebase with the config from firebase-applet-config.json
const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore using the specified databaseId
export const db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId);

/**
 * Tạo một mã phòng ngẫu nhiên gồm 5 chữ số/chữ cái viết hoa
 */
export function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Tạo phòng game mới
 */
export async function createGameRoom(
  hostPlayerId: string,
  hostPlayerName: string,
  isPublic: boolean = false
): Promise<string> {
  const roomId = generateRoomId();
  const roomRef = doc(db, "rooms", roomId);

  // Khởi tạo trạng thái rỗng
  const initialRoomState = {
    roomId,
    hostId: hostPlayerId,
    players: [
      {
        id: hostPlayerId,
        name: hostPlayerName,
        character: {
          name: "Ẩn danh",
          alignment: "NEUTRAL",
          hp: 10,
          abilityName: "",
          abilityDesc: "",
          winCondition: ""
        },
        currentHp: 10,
        locationId: null,
        alignmentRevealed: false,
        equipments: [],
        drawnCards: [],
        isBot: false,
        isDead: false,
        color: "#EF4444" // Red
      }
    ],
    turnIndex: 0,
    phase: "lobby",
    rolledDice: null,
    logs: [],
    winnerAlignment: null,
    selectedPlayerIdForHermit: null,
    selectedPlayerIdForAttack: null,
    selectedCard: null,
    lastAttackDamage: null,
    isPublicRoom: isPublic,
    createdAt: Date.now()
  };

  await setDoc(roomRef, initialRoomState);
  return roomId;
}

/**
 * Tham gia một phòng game hiện có
 */
export async function joinGameRoom(
  roomId: string,
  playerId: string,
  playerName: string
): Promise<boolean> {
  const roomRef = doc(db, "rooms", roomId);
  const docSnap = await getDoc(roomRef);

  if (!docSnap.exists()) {
    throw new Error("Phòng game không tồn tại!");
  }

  const roomData = docSnap.data();
  if (roomData.phase !== "lobby") {
    throw new Error("Trận đấu trong phòng này đã bắt đầu!");
  }

  if (12 <= roomData.players.length) {
    throw new Error("Phòng đã đầy (Tối đa 12 người chơi)!");
  }

  // Check if player already in room
  const alreadyIn = roomData.players.some((p: any) => p.id === playerId);
  if (alreadyIn) return true;

  const playerColors = [
    "#EF4444", "#3B82F6", "#10B981", "#F59E0B", 
    "#8B5CF6", "#EC4899", "#14B8A6", "#6B7280",
    "#84CC16", "#6366F1", "#F97316", "#06B6D4"
  ];
  const assignedColor = playerColors[roomData.players.length % playerColors.length];

  const newPlayer = {
    id: playerId,
    name: playerName,
    character: {
      name: "Ẩn danh",
      alignment: "NEUTRAL",
      hp: 10,
      abilityName: "",
      abilityDesc: "",
      winCondition: ""
    },
    currentHp: 10,
    locationId: null,
    alignmentRevealed: false,
    equipments: [],
    drawnCards: [],
    isBot: false,
    isDead: false,
    color: assignedColor
  };

  const updatedPlayers = [...roomData.players, newPlayer];
  await updateDoc(roomRef, {
    players: updatedPlayers
  });

  return true;
}

/**
 * Lắng nghe cập nhật của một phòng game thời gian thực
 */
export function listenToRoom(roomId: string, callback: (data: any) => void) {
  const roomRef = doc(db, "rooms", roomId);
  return onSnapshot(roomRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback(null);
    }
  });
}

/**
 * Cập nhật trạng thái mới cho phòng game
 */
export async function updateRoomState(roomId: string, newState: any) {
  const roomRef = doc(db, "rooms", roomId);
  await setDoc(roomRef, newState, { merge: true });
}

/**
 * Lấy danh sách các phòng game công khai
 */
export async function getPublicRooms(): Promise<any[]> {
  const roomsCol = collection(db, "rooms");
  const q = query(
    roomsCol, 
    where("isPublicRoom", "==", true), 
    where("phase", "==", "lobby"),
    limit(10)
  );
  const querySnapshot = await getDocs(q);
  const rooms: any[] = [];
  querySnapshot.forEach((doc) => {
    rooms.push(doc.data());
  });
  return rooms;
}

/**
 * Đồng bộ hóa toàn bộ danh sách thẻ bài cục bộ lên Firestore (chỉ chạy khi collection cards trống)
 */
export async function syncLocalCardsToFirebase(cards: any[]): Promise<void> {
  const cardsCol = collection(db, "cards");
  const snapshot = await getDocs(cardsCol);
  
  const firestoreCardIds = new Set(snapshot.docs.map(doc => doc.id));
  const hasNewCards = cards.some(c => !firestoreCardIds.has(c.id));

  if (snapshot.empty || snapshot.size !== cards.length || hasNewCards) {
    console.log("Firestore cards collection needs update. Syncing cards...");
    
    // Xóa các thẻ cũ để làm sạch database
    if (!snapshot.empty) {
      const deleteBatch = writeBatch(db);
      snapshot.forEach((docSnap) => {
        deleteBatch.delete(docSnap.ref);
      });
      await deleteBatch.commit();
    }
    
    // Đăng ký ghi mới hàng loạt (batch)
    const batch = writeBatch(db);
    cards.forEach((card) => {
      const cardRef = doc(db, "cards", card.id);
      batch.set(cardRef, card);
    });
    await batch.commit();
  }
}

/**
 * Tải danh sách thẻ bài từ Firestore
 */
export async function fetchCardsFromFirebase(): Promise<any[]> {
  const cardsCol = collection(db, "cards");
  const snapshot = await getDocs(cardsCol);
  const cards: any[] = [];
  snapshot.forEach((doc) => {
    cards.push(doc.data());
  });
  return cards;
}
