import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";

export type HintLevel = "none" | "small" | "big";

const increaseHint = (currentLevel: HintLevel): HintLevel => {
  switch (currentLevel) {
    case "none":
      return "small";
    case "small":
      return "big";
    case "big":
      return "big";
    default:
      return "none";
  }
};

interface AppState {
  confettiOnScreen: boolean;
  found: number[];
  hints: [HintLevel, HintLevel, HintLevel, HintLevel, HintLevel];
}

type Action =
  | { type: "LOAD_STATE"; payload: AppState }
  | { type: "ADD_FOUND"; payload: number }
  | { type: "RESET_FOUND" }
  | { type: "INCREASE_HINT"; payload: number }
  | { type: "RESET_HINTS" }
  | { type: "HIDE_CONFETTI" };

const initialState: AppState = {
  confettiOnScreen: false,
  found: [],
  hints: ["none", "none", "none", "none", "none"],
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addFound: (index: number) => void;
  resetFound: () => void;
  increaseHint: (index: number) => void;
  resetHints: () => void;
  hideConfetti: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case "LOAD_STATE":
      return { ...action.payload };
    case "ADD_FOUND":
      return {
        ...state,
        confettiOnScreen: !state.found.includes(action.payload),
        found: Array.from(new Set([...state.found, action.payload])),
      };
    case "RESET_FOUND":
      return { ...state, found: [] };
    case "INCREASE_HINT":
      const newHints = [...state.hints] as typeof state.hints;
      newHints[action.payload] = increaseHint(state.hints[action.payload]);
      return { ...state, hints: newHints };
    case "RESET_HINTS":
      return { ...state, hints: initialState.hints };
    case "HIDE_CONFETTI":
      return { ...state, confettiOnScreen: false };
    default:
      return state;
  }
};

const LOCAL_STORAGE_KEY = "appState";

const loadState = (): AppState => {
  if (typeof window === "undefined") {
    return initialState;
  }
  try {
    const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (serializedState === null) {
      return initialState;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Error loading state from localStorage:", err);
    return initialState;
  }
};

const saveState = (state: AppState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
  } catch (err) {
    console.error("Error saving state to localStorage:", err);
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const savedState = loadState();
    dispatch({ type: "LOAD_STATE", payload: savedState });
  }, []);

  useEffect(() => {
    saveState(state);
  }, [JSON.stringify(state)]);

  const addFound = (index: number) => {
    dispatch({ type: "ADD_FOUND", payload: index });
  };

  const resetFound = () => {
    dispatch({ type: "RESET_FOUND" });
  };

  const increaseHint = (index: number) => {
    dispatch({ type: "INCREASE_HINT", payload: index });
  };

  const resetHints = () => {
    dispatch({ type: "RESET_HINTS" });
  };

  const hideConfetti = () => {
    dispatch({ type: "HIDE_CONFETTI" });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        addFound,
        resetFound,
        increaseHint,
        resetHints,
        hideConfetti,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
