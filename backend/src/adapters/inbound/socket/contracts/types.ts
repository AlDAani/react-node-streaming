import { SOCKET_EVENTS } from './constants';

export type TSocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
