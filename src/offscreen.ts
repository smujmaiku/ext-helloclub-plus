import { type DataConnection, Peer } from 'peerjs';

const RECONN_MS = 20_000;

let peer = new Peer();
let conn: DataConnection | null = null;

// pid via hash
const pid = decodeURIComponent(location.hash.slice(1));

let connCtrl = new AbortController();
function openPeer() {
	connCtrl.abort();
	connCtrl = new AbortController();

	console.log('openPeer', pid);
	const tconn = peer.connect(pid, {
		serialization: 'raw',
		// reliable: true,
	});
	conn = tconn;
	if (!tconn) return;

	const handlePeerOpen = () => {
		console.log('peer open');
		chrome.runtime.sendMessage({ type: 'PEER_OPEN' });
	};
	const handlePeerData = (data: unknown) => {
		console.log(data);
		chrome.runtime.sendMessage({ type: 'PEER_DATA', payload: data });
	};
	const handlePeerClose = () => {
		chrome.runtime.sendMessage({ type: 'PEER_CLOSE' });
	};
	const handlePeerError = (error: Error) => {
		console.log(error);
		chrome.runtime.sendMessage({ type: 'PEER_ERROR', payload: error?.message });
	};
	tconn.on('open', handlePeerOpen);
	tconn.on('data', handlePeerData);
	tconn.on('close', handlePeerClose);
	tconn.on('error', handlePeerError);

	connCtrl.signal.addEventListener('abort', () => {
		if (!tconn) return;
		tconn.off('open', handlePeerOpen);
		tconn.off('data', handlePeerData);
		tconn.off('close', handlePeerClose);
		tconn.off('error', handlePeerError);
		tconn.close();
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
		console.log('upkeep: disconnected');
		chrome.runtime.sendMessage({ type: 'DISCONNECTED' });
		peer.reconnect();
	} else if (!conn?.open) {
		console.log('upkeep: peer closed');
		chrome.runtime.sendMessage({ type: 'PEER_CLOSE' });
		openPeer();
	} else {
		chrome.runtime.sendMessage({ type: 'PEER_OPEN' });
	}
}, RECONN_MS);
