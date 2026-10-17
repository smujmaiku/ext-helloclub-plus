import { type DataConnection, Peer } from 'peerjs';

const RECONN_MS = 10_000;

let peer = new Peer();
let conn: DataConnection | null = null;

// pid via hash
const pid = decodeURIComponent(location.hash.slice(1));

const connCtrl = new AbortController();
function openPeer() {
	const tconn = conn = peer.connect(pid, { reliable: true });
	if (!tconn) return;

	const handlePeerOpen = () => {
		chrome.runtime.sendMessage({ type: 'PEER_OPEN' });
	};
	const handlePeerData = (data: unknown) => {
		chrome.runtime.sendMessage({ type: 'PEER_DATA', payload: data });
	};
	const handlePeerClose = () => {
		chrome.runtime.sendMessage({ type: 'PEER_CLOSE' });
	};
	const handlePeerError = () => {
		chrome.runtime.sendMessage({ type: 'PEER_ERROR' });
	};
	tconn.on('open', handlePeerOpen);
	tconn.on('data', handlePeerData);
	tconn.on('error', handlePeerClose);
	tconn.on('close', handlePeerError);

	connCtrl.signal.addEventListener('abort', () => {
		if (!tconn) return;
		tconn.off('open', handlePeerOpen);
		tconn.off('data', handlePeerData);
		tconn.off('error', handlePeerClose);
		tconn.off('close', handlePeerError);
	});
}

const handleOpen = () => {
	chrome.runtime.sendMessage({ type: 'OPEN' });
	openPeer();
};
const handleDisconnected = () => {
	chrome.runtime.sendMessage({ type: 'DISCONNECTED' });
};
const handleError = () => {
	chrome.runtime.sendMessage({ type: 'ERROR' });
};

peer.on('open', handleOpen);
peer.on('disconnected', handleDisconnected);
peer.on('error', handleError);

setInterval(() => {
	if (!peer.open) {
		chrome.runtime.sendMessage({ type: 'DISCONNECTED' });
		peer.reconnect();
	} else if (!conn?.open) {
		chrome.runtime.sendMessage({ type: 'PEER_CLOSE' });
		openPeer();
	}
}, RECONN_MS);
