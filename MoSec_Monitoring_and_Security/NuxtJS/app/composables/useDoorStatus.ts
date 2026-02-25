export const useDoorStatus = () => {
  const doorId = useState<string>('doorId', () => '');
  
  const fetchDoorId = async () => {
    try {
      const data = await $fetch('/api/door');
      doorId.value = String(data.id);
    } catch (error) {
      console.error('Gagal mengambil ID pintu:', error);
    }
  };
  
  const updateDoorId = async (id: string) => {
    try {
      await $fetch('/api/door', {
        method: 'POST',
        body: { id }
      });
      doorId.value = id;
      console.log(doorId)
    } catch (error) {
      console.error('Gagal update ID pintu:', error);
    }
  };
  
  return {
    doorId: readonly(doorId),
    fetchDoorId,
    updateDoorId
  };
};