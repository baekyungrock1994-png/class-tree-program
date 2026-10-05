import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

/**
 * 1. 실시간 포스트(활동 카드) 구독
 * Firestore의 'posts' 컬렉션에서 현재 보드(또는 노드)에 속한 카드들을 실시간 청취
 */
export function subscribeBoardPosts(boardId, onData, onError) {
  try {
    const postsRef = collection(db, 'posts');
    // boardId 기준 쿼리 (없으면 전체 수신)
    const q = boardId ? query(postsRef, where('boardId', '==', boardId)) : postsRef;

    return onSnapshot(q, (snapshot) => {
      const postsList = [];
      snapshot.forEach((docSnap) => {
        postsList.push({ id: docSnap.id, ...docSnap.data() });
      });
      onData(postsList);
    }, (error) => {
      console.warn('[Firebase] 포스트 실시간 구독 알림:', error.message);
      if (onError) onError(error);
    });
  } catch (err) {
    console.warn('[Firebase] subscribeBoardPosts 실패:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * 2. 포스트 저장 (생성 또는 수정)
 */
export async function savePostToFirestore(post) {
  try {
    if (!post.id) return;
    const postRef = doc(db, 'posts', post.id);
    await setDoc(postRef, {
      ...post,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn('[Firebase] savePostToFirestore 실패 (로컬 상태 유지):', error.message);
    return false;
  }
}

/**
 * 3. 포스트 삭제
 */
export async function deletePostFromFirestore(postId) {
  try {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
    return true;
  } catch (error) {
    console.warn('[Firebase] deletePostFromFirestore 실패:', error.message);
    return false;
  }
}

/**
 * 4. 댓글 추가
 */
export async function addCommentToFirestore(postId, newComment, existingComments = []) {
  try {
    const postRef = doc(db, 'posts', postId);
    const updatedComments = [...existingComments, newComment];
    await updateDoc(postRef, {
      comments: updatedComments
    });
    return true;
  } catch (error) {
    console.warn('[Firebase] addCommentToFirestore 실패:', error.message);
    return false;
  }
}

/**
 * 5. 좋아요 토글
 */
export async function toggleLikeInFirestore(postId, studentId, currentLikes = 0, currentLikedBy = []) {
  try {
    const postRef = doc(db, 'posts', postId);
    const hasLiked = currentLikedBy.includes(studentId);
    const nextLikedBy = hasLiked
      ? currentLikedBy.filter((id) => id !== studentId)
      : [...currentLikedBy, studentId];
    const nextLikes = hasLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    await updateDoc(postRef, {
      likes: nextLikes,
      likedBy: nextLikedBy
    });
    return true;
  } catch (error) {
    console.warn('[Firebase] toggleLikeInFirestore 실패:', error.message);
    return false;
  }
}

/**
 * 6. 보드 수업 상태 실시간 구독 (진도 단계, 잠금 상태 등)
 */
export function subscribeBoardState(boardId, onData, onError) {
  if (!boardId) return () => {};
  try {
    const boardRef = doc(db, 'boards', boardId);
    return onSnapshot(boardRef, (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data());
      }
    }, (error) => {
      console.warn('[Firebase] 보드 상태 실시간 구독 알림:', error.message);
      if (onError) onError(error);
    });
  } catch (err) {
    console.warn('[Firebase] subscribeBoardState 실패:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * 7. 보드 수업 상태 업데이트 (교사가 단계 이동 또는 잠금 시)
 */
export async function updateBoardStateInFirestore(boardId, updates) {
  if (!boardId) return false;
  try {
    const boardRef = doc(db, 'boards', boardId);
    await setDoc(boardRef, {
      ...updates,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn('[Firebase] updateBoardStateInFirestore 실패:', error.message);
    return false;
  }
}

/**
 * 8. 이미지 업로드 (Firebase Storage)
 */
export async function uploadImageFile(file, pathPrefix = 'class-photos') {
  try {
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, `${pathPrefix}/${filename}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn('[Firebase] Storage 업로드 실패 (Base64 fallback 권장):', error.message);
    return null;
  }
}

/**
 * 9. 전체 사용자(가입 신청 및 정식 계정) 실시간 구독
 */
export function subscribeUsers(onData, onError) {
  try {
    const usersRef = collection(db, 'users');
    return onSnapshot(usersRef, (snapshot) => {
      const usersList = [];
      snapshot.forEach((docSnap) => {
        usersList.push({ id: docSnap.id, ...docSnap.data() });
      });
      onData(usersList);
    }, (error) => {
      console.warn('[Firebase] users 실시간 구독 알림:', error.message);
      if (onError) onError(error);
    });
  } catch (err) {
    console.warn('[Firebase] subscribeUsers 실패:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * 10. 신규 사용자 가입 신청 또는 사용자 저장 (Firestore)
 */
export async function saveUserToFirestore(user) {
  try {
    if (!user || !user.id) return false;
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      ...user,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn('[Firebase] saveUserToFirestore 실패 (로컬 상태 유지):', error.message);
    return false;
  }
}

/**
 * 11. 사용자 정보 업데이트 (승인/반려/비밀번호 변경 등)
 */
export async function updateUserInFirestore(userId, updates) {
  try {
    if (!userId) return false;
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn('[Firebase] updateUserInFirestore 실패:', error.message);
    return false;
  }
}

/**
 * 12. 사용자 삭제 (탈퇴 처리)
 */
export async function deleteUserFromFirestore(userId) {
  try {
    if (!userId) return false;
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    return true;
  } catch (error) {
    console.warn('[Firebase] deleteUserFromFirestore 실패:', error.message);
    return false;
  }
}

/**
 * 13. 학급(교실) Firestore 실시간 저장
 */
export async function saveClassroomToFirestore(classroom) {
  try {
    if (!classroom || !classroom.id) return false;
    const cleanCode = (classroom.code || '').trim().toUpperCase();
    const normalizedCode = cleanCode.replace(/[\s\-_]/g, '');
    const classRef = doc(db, 'classrooms', classroom.id);
    await setDoc(classRef, {
      ...classroom,
      code: cleanCode,
      normalizedCode,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn('[Firebase] saveClassroomToFirestore 실패:', error.message);
    return false;
  }
}

/**
 * 14. 전체 학급(교실) 실시간 구독
 */
export function subscribeClassrooms(onData, onError) {
  try {
    const classRef = collection(db, 'classrooms');
    return onSnapshot(classRef, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      onData(list);
    }, (error) => {
      console.warn('[Firebase] classrooms 실시간 구독 알림:', error.message);
      if (onError) onError(error);
    });
  } catch (err) {
    console.warn('[Firebase] subscribeClassrooms 실패:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * 15. 코드로 학급 찾기 (Firestore)
 */
export async function findClassroomByCodeInFirestore(inputCode) {
  try {
    if (!inputCode) return null;
    const normalizedInput = inputCode.toString().trim().toUpperCase().replace(/[\s\-_]/g, '');
    const classRef = collection(db, 'classrooms');
    const snapshot = await getDocs(classRef);
    let found = null;
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const codeA = (data.code || '').toString().trim().toUpperCase().replace(/[\s\-_]/g, '');
      const codeB = (data.normalizedCode || '').toString().trim().toUpperCase();
      if (codeA === normalizedInput || codeB === normalizedInput) {
        found = { id: docSnap.id, ...data };
      }
    });
    return found;
  } catch (error) {
    console.warn('[Firebase] findClassroomByCodeInFirestore 실패:', error.message);
    return null;
  }
}


