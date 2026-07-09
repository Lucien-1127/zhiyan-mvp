import { useTelegramPopup } from '../../hooks/telegram';
import { useCallback } from 'react';

export function TgPopupBridge() {
  const { openPopup } = useTelegramPopup();
  const confirm = useCallback(async (
    title: string,
    message: string,
  ) => {
    const result = await openPopup(title, message, [
      { id: 'cancel', type: 'cancel', text: '取消' },
      { id: 'confirm', type: 'destructive', text: '確定' },
    ]);
    return result?.id === 'confirm';
  }, [openPopup]);

  return { confirm };
}
