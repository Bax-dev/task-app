export function formatProjectCount(count: number): string {
  if (count === 0) return 'No projects';
  if (count === 1) return '1 project';
  return `${count} projects`;
}
