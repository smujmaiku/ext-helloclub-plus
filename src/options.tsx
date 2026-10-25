import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { PEERID_KEY } from './shared.ts';

function Options() {
	const [peerId, setPeerId] = useState('');
	const [status, setStatus] = useState('');

	useEffect(() => {
		chrome.storage.local.get([PEERID_KEY]).then((data) => {
			const { [PEERID_KEY]: pid } = data;
			setPeerId(
				typeof pid === 'string' ? pid : '',
			);
		}).catch(console.error);
	}, []);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		await chrome.storage.local.set({ [PEERID_KEY]: (peerId || '').trim() });
		setStatus('Saved');
		setTimeout(() => setStatus(''), 2000);
	}

	return (
		<form
			onSubmit={handleSubmit}
			style={{
				padding: '16px',
				minWidth: '320px',
				display: 'flex',
				flexDirection: 'column',
				gap: '8px',
			}}
		>
			<h2>HelloClub Plus</h2>
			<label style={{ display: 'block' }}>
				Scanner peer id
				<input
					type='text'
					value={peerId}
					onInput={(e) => setPeerId(e.currentTarget.value)}
					placeholder='Leave empty to disable'
					style={{ display: 'block', width: '100%' }}
				/>
			</label>
			<button type='submit'>Save</button>
			<span>{status}</span>
		</form>
	);
}

render(<Options />, document.getElementById('root')!);
