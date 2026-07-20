import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User, Project, Note, ChatSession, ChatMessage, GeneratedDocument } from '@/types';

interface SyncData {
  user: User | null;
  projects: Project[];
  notes: Note[];
  documents: GeneratedDocument[];
  chatSessions: ChatSession[];
  chatMessages: ChatMessage[];
}

export const firestoreSync = {
  async pullAll(userId: string): Promise<SyncData> {
    if (!db) return { user: null, projects: [], notes: [], documents: [], chatSessions: [], chatMessages: [] };

    const [projectsSnap, notesSnap, docsSnap, sessionsSnap, messagesSnap] = await Promise.all([
      getDocs(query(collection(db, 'projects'), where('userId', '==', userId))),
      getDocs(query(collection(db, 'notes'), where('userId', '==', userId))),
      getDocs(query(collection(db, 'documents'), where('userId', '==', userId))),
      getDocs(query(collection(db, 'chatSessions'), where('userId', '==', userId))),
      getDocs(query(collection(db, 'chatMessages'), where('userId', '==', userId))),
    ]);

    const projects = projectsSnap.docs.map((d) => d.data() as Project);
    const notes = notesSnap.docs.map((d) => d.data() as Note);
    const documents = docsSnap.docs.map((d) => d.data() as GeneratedDocument);
    const chatSessions = sessionsSnap.docs.map((d) => d.data() as ChatSession);
    const chatMessages = messagesSnap.docs.map((d) => d.data() as ChatMessage);

    const userSnap = await getDoc(doc(db, 'users', userId));
    const user = userSnap.exists() ? (userSnap.data() as User) : null;

    return { user, projects, notes, documents, chatSessions, chatMessages };
  },

  async pushProject(project: Project) {
    if (!db) return;
    await setDoc(doc(db, 'projects', project.id), project);
  },

  async deleteProject(id: string) {
    if (!db) return;
    await deleteDoc(doc(db, 'projects', id));
  },

  async pushNote(note: Note) {
    if (!db) return;
    await setDoc(doc(db, 'notes', note.id), note);
  },

  async deleteNote(id: string) {
    if (!db) return;
    await deleteDoc(doc(db, 'notes', id));
  },

  async pushDocument(doc_: GeneratedDocument) {
    if (!db) return;
    await setDoc(doc(db, 'documents', doc_.id), doc_);
  },

  async pushChatSession(session: ChatSession) {
    if (!db) return;
    await setDoc(doc(db, 'chatSessions', session.id), session);
  },

  async deleteChatSession(id: string, userId: string) {
    if (!db) return;
    await deleteDoc(doc(db, 'chatSessions', id));
    const messagesSnap = await getDocs(
      query(collection(db, 'chatMessages'), where('sessionId', '==', id), where('userId', '==', userId)),
    );
    await Promise.all(messagesSnap.docs.map((d) => deleteDoc(doc(db, 'chatMessages', d.id))));
  },

  async pushChatMessage(message: ChatMessage) {
    if (!db) return;
    await setDoc(doc(db, 'chatMessages', message.id), message);
  },

  async pushUser(user: User) {
    if (!db) return;
    await setDoc(doc(db, 'users', user.id), user);
  },

  subscribeNotes(userId: string, callback: (notes: Note[]) => void): Unsubscribe | null {
    if (!db) return null;
    const q = query(collection(db, 'notes'), where('userId', '==', userId));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => d.data() as Note));
    });
  },

  subscribeProjects(userId: string, callback: (projects: Project[]) => void): Unsubscribe | null {
    if (!db) return null;
    const q = query(collection(db, 'projects'), where('userId', '==', userId));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => d.data() as Project));
    });
  },
};
