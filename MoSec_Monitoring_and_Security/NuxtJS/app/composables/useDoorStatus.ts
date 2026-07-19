export const useDoorStatus = () => {
  const doorState = useState<string>('doorState', () => '');

  const fetchDoorStatus = async (roomId?: string) => {
    try {
      const params = roomId ? { roomId } : {};
      const data: any = await $fetch('/api/door', { params });
      if (roomId) {
        doorState.value = data.state;
      } else if (data.data?.length) {
        doorState.value = data.data[0]?.state || '';
      }
    } catch (error) {
      console.error('Gagal mengambil status pintu:', error);
    }
  };

  const updateDoorStatus = async (roomName: string, state: string) => {
    try {
      await $fetch('/api/door', {
        method: 'POST',
        body: { room: roomName, state }
      });
      doorState.value = state;
    } catch (error) {
      console.error('Gagal update status pintu:', error);
    }
  };

  return {
    doorState: readonly(doorState),
    fetchDoorStatus,
    updateDoorStatus
  };
};