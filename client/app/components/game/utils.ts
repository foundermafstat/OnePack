export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const rotateMatrix = (matrix: number[][]): number[][] => {
	const rows = matrix.length;
	const cols = matrix[0].length;
	const newMatrix = Array.from({ length: cols }, () => Array(rows).fill(0));
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			newMatrix[x][rows - 1 - y] = matrix[y][x];
		}
	}
	return newMatrix;
};

