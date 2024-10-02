import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";

interface AppState {
  found: number[];
}

type Action =
  | { type: "LOAD_STATE"; payload: AppState }
  | { type: "ADD_FOUND"; payload: number }
  | { type: "RESET_FOUND" };

const initialState: AppState = {
  found: [],
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addFound: (index: number) => void;
  resetFound: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case "LOAD_STATE":
      return { ...action.payload };
    case "ADD_FOUND":
      return {
        ...state,
        found: Array.from(new Set([...state.found, action.payload])),
      };
    case "RESET_FOUND":
      return { ...state, found: [] };
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

  const addFound = (item: number) => {
    dispatch({ type: "ADD_FOUND", payload: item });
  };

  const resetFound = () => {
    dispatch({ type: "RESET_FOUND" });
  };

  const value = {
    state,
    dispatch,
    addFound,
    resetFound,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
