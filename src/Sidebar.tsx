import { useEffect, useState } from 'preact/hooks';
import { fetchCheckedIn, getOrg, postCheckOut } from './services/api.ts';

namespace Sidebar {
	export interface Props {
		anchor: HTMLElement;
	}
}

function formatDuration(dateStr: string): string {
	const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
	if (mins < 60) return `${mins}m`;
	const hrs = Math.floor(mins / 60);
	const rem = mins % 60;
	return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export function Sidebar({ anchor }: Sidebar.Props) {
	const [open, setOpen] = useState(false);
	const [members, setMembers] = useState<fetchCheckedIn.CheckInLog[]>([]);
	const [loading, setLoading] = useState(false);

	async function refresh() {
		setLoading(true);
		try {
			const logs = await fetchCheckedIn();
			setMembers(logs.filter((l) => l.wasCheckedIn));
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		const observer = new MutationObserver(() => {
			setOpen(!anchor.classList.contains('ng-hide'));
		});
		observer.observe(anchor, { attributes: true, attributeFilter: ['class'] });
		return () => observer.disconnect();
	}, [anchor]);

	useEffect(() => {
		if (!open) return;
		refresh();
		const interval = setInterval(refresh, 30_000);
		return () => clearInterval(interval);
	}, [open]);

	async function handleCheckout(profileId: string) {
		await postCheckOut(profileId);
		await refresh();
	}

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
			{loading && members.length === 0
				? <p>Loading...</p>
				: (
					<table style={{ width: '100%', borderCollapse: 'collapse' }}>
						<thead>
							<tr>
								<th style={{ textAlign: 'left', paddingBottom: '8px' }}>
									Name
								</th>
								<th style={{ textAlign: 'left', paddingBottom: '8px' }}>
									Duration
								</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{members.length === 0
								? (
									<tr>
										<td>No one checked in.</td>
										<td />
										<td />
									</tr>
								)
								: members.map((log) => (
									<tr
										key={log.profile.id}
										style={{ borderTop: '1px solid #eee' }}
									>
										<td style={{ padding: '6px 0' }}>
											<a
												href={`https://${getOrg().subdomain}.helloclub.com/admin/people/members/edit/${log.profile.id}`}
												rel='noreferrer'
											>
												{log.profile.name}
											</a>
										</td>
										<td style={{ padding: '6px 8px' }}>
											{formatDuration(log.date)}
										</td>
										<td style={{ padding: '6px 0' }}>
											<button onClick={() => handleCheckout(log.profile.id)}>
												Check out
											</button>
										</td>
									</tr>
								))}
						</tbody>
					</table>
				)}
		</div>
	);
}
