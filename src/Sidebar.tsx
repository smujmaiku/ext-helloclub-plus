import { useEffect, useState } from 'preact/hooks';

interface Props {
	anchor: HTMLElement;
}

export function Sidebar({ anchor }: Props) {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const observer = new MutationObserver(() => {
			setOpen(!anchor.classList.contains('ng-hide'));
		});
		observer.observe(anchor, { attributes: true, attributeFilter: ['class'] });
		return () => observer.disconnect();
	}, [anchor]);

	return (
		<div
			style={{
				position: 'fixed',
				zIndex: '9999',
				top: '0',
				right: '0',
				overflow: 'auto',
				height: '100vh',
				width: '320px',
				transition: 'transform ease-out 150ms',
				boxShadow: '3px 0 10px rgba(0, 0, 0, .1)',
				background: 'white',
				transform: open ? 'translateX(0)' : 'translateX(100%)',
				overflowY: 'auto',
				padding: '16px',
			}}
		>
			<h2>HelloClub Plus</h2>
		</div>
	);
}
