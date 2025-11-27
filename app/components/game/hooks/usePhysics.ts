import { useEffect } from 'react';
import { PhysicsItem } from '../types';

export const usePhysics = (
	setFallingItems: React.Dispatch<React.SetStateAction<PhysicsItem[]>>
) => {
	useEffect(() => {
		let lastTime = performance.now();

		const loop = (time: number) => {
			const dt = (time - lastTime) / 1000;
			lastTime = time;

			setFallingItems((items) =>
				items.map((p) => {
					let { x, y, vx, vy, rotation, vr } = p;
					vy += 1500 * dt;
					x += vx * dt;
					y += vy * dt;
					rotation += vr * dt;

					if (y > window.innerHeight - 80) {
						y = window.innerHeight - 80;
						vy = -vy * 0.5;
						vx *= 0.9;
						vr *= 0.9;
						if (Math.abs(vy) < 50) vy = 0;
					}

					if (x < 0) {
						x = 0;
						vx = -vx * 0.6;
					}
					if (x > window.innerWidth - 50) {
						x = window.innerWidth - 50;
						vx = -vx * 0.6;
					}

					return { ...p, x, y, vx, vy, rotation, vr };
				})
			);

			requestAnimationFrame(loop);
		};

		const id = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(id);
	}, [setFallingItems]);
};

