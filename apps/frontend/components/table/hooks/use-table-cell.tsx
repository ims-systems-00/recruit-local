import { useCallback, useEffect, useState } from "react";

// State types for cell saving
enum STATUS {
  DEFAULT = "Default",
  BLINKING = "Blinking",
  SAVE_SUCCESS = "Save success",
  SAVE_FAIL = "Save fail",
}

// Interface for hook arguments with generic `T`
interface UseTableCellProps<T> {
  defaultValue?: T | "";
  onSave?: (value: T) => Promise<void>;
}

// Hook with generic type for value
export function useTableCell<T>({ defaultValue = "", onSave = async () => {} }: UseTableCellProps<T>) {
  const [value, setValue] = useState<T | "">(defaultValue);
  const [autoSaved, setAutoSaved] = useState<STATUS>(STATUS.DEFAULT);

  // Control save state (blinking, success, fail)
  const controlSaveState = useCallback((status: STATUS) => {
    setAutoSaved(status);
  }, []);

  // Reset save state after animations (1 second)
  const resetSaveState = useCallback(() => {
    setTimeout(() => setAutoSaved(STATUS.DEFAULT), 1010);
  }, []);

  // Handle save with async onSave function
  const handleSave = useCallback(
    async (value: T) => {
      controlSaveState(STATUS.BLINKING);
      try {
        if (onSave && value !== null) {
          await onSave(value);
        }
        controlSaveState(STATUS.SAVE_SUCCESS);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        controlSaveState(STATUS.SAVE_FAIL);
      } finally {
        resetSaveState();
      }
    },
    [onSave, controlSaveState, resetSaveState]
  );

  // Handle input change
  const handleChange = useCallback((newValue: T | "") => {
    setValue(newValue);
  }, []);

  // Update value if defaultValue changes
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return {
    states: STATUS,
    autoSaved,
    value,
    handleSave,
    handleChange,
  };
}
