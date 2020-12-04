import { call, put, select, takeEvery } from 'redux-saga/effects';
import * as chats from './types';
import { api } from 'services';
import { saveChats, saveUsersForChat } from './actions';
import { getAuthProfileUid } from 'store/auth/selectors';
import { getChatsList } from './selectors';
import { parseChatsList, parseNewMessage } from 'services/api/parse';

function* createNewChatSaga(action) {
    try {
        const { payload } = action;
        const { chatWithUserUid, callback } = payload;
        const userUid = yield select(getAuthProfileUid)
        const chat = {
            messages: [],
            users: [userUid, chatWithUserUid]
        }
        yield call(api.chats.createNewChat, chat);
        if (typeof callback === "function") {
            callback()
        }
    } catch (error) {
        console.warn(error);
    }
}

function* fetchUsersForChatSaga() {
    try {
        const response = yield call(api.chats.fetchProfiles);
        if (!response) return;
        const userUid = yield select(getAuthProfileUid)
        const chats = yield select(getChatsList)
        const profiles = response.filter(profile => profile.id !== userUid && !chats.find(chat => chat.userInfo.uid === profile.id))
        yield put(saveUsersForChat(profiles))
    } catch (error) {
        console.warn(error);
    }
}

function* setUpdateChatMessageSaga(action) {
    try {
        const { payload } = action;
        const { chatUid, data } = payload;

        const chats = yield select(getChatsList)
        const updatedChats = [...chats].map(chat => {
            if (chat.id === chatUid) return { ...chat, messages: data.messages }
            return chat
        })
        const userUid = yield select(getAuthProfileUid)
        yield put(saveChats(parseChatsList(updatedChats, userUid)))
    } catch (error) {
        console.log(error);
    }
}

function* sendMessageSaga(action) {
    try {
        const { payload } = action;
        const { chatUid, message } = payload
        const profileUid = yield select(getAuthProfileUid)
        const preparedNewMessage = parseNewMessage({ uid: profileUid, message })
        yield call(api.chats.sendMessage, { chatUid, message: preparedNewMessage })
    } catch (error) {
        console.log(error);
    }
}

export function* chatsSaga() {
    yield takeEvery(chats.CREATE_NEW_CHAT, createNewChatSaga);
    yield takeEvery(chats.FETCH_USERS_FOR_CHAT, fetchUsersForChatSaga);
    yield takeEvery(chats.SET_UPDATED_CHAT_MESSAGES, setUpdateChatMessageSaga);
    yield takeEvery(chats.SEND_MESSAGE, sendMessageSaga);
}
