import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Gamepad2, Users, Zap, Brain, Trophy, Play, CheckCircle2, XCircle,
  Clock, Target, Sparkles, RefreshCw, ArrowRight, Loader2, Timer, Flame,
  GripVertical, ArrowUp, ArrowDown, Search
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WS_URL = process.env.REACT_APP_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://');

// Word Search Game Component - interactive grid-based word search
const WordSearchGameComponent = ({ session, language, matchedPairs, setMatchedPairs, setScore, setStreak, handleGameComplete, submitAnswer }) => {
  const [grid, setGrid] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [foundWords, setFoundWords] = useState([]);
  const [wordPositions, setWordPositions] = useState({});
  const gridRef = useRef(null);
  const [actualWords, setActualWords] = useState([]);
  const [gridSizeUsed, setGridSizeUsed] = useState(12);
  
  const words = session?.game_payload?.words || [];
  const hints = session?.game_payload?.hints || [];
  const gridSize = session?.game_payload?.grid_size || 12;
  
  // Generate grid with words placed
  useEffect(() => {
    if (words.length === 0) return;
    
    const newGrid = generateWordSearchGrid(words, gridSize);
    setGrid(newGrid.grid);
    setWordPositions(newGrid.positions);
    setActualWords(newGrid.placedWords); // Only show words that were actually placed
    setGridSizeUsed(newGrid.effectiveSize);
    
    if (newGrid.failedWords.length > 0) {
      console.warn('[WordSearch] Failed to place words:', newGrid.failedWords);
      toast.warning(`Some words may be missing from the grid`);
    }
  }, [words, gridSize]);
  
  // Generate word search grid with words placed in various directions
  const generateWordSearchGrid = (wordsToPlace, size) => {
    // Ensure grid is large enough for the longest word
    const longestWordLength = Math.max(...wordsToPlace.map(w => w.length));
    const effectiveSize = Math.max(size, longestWordLength + 2);
    
    const gridArr = Array(effectiveSize).fill(null).map(() => Array(effectiveSize).fill(''));
    const positions = {};
    const placedWords = [];
    const failedWords = [];
    
    // Use only directions that work well for word search
    const directions = [
      [0, 1],   // right
      [1, 0],   // down
      [1, 1],   // diagonal down-right
    ];
    
    // Sort words by length (longer first for better placement)
    const sortedWords = [...wordsToPlace].sort((a, b) => b.length - a.length);
    
    sortedWords.forEach(word => {
      let placed = false;
      let attempts = 0;
      const maxAttempts = 500; // More attempts for difficult placements
      
      while (!placed && attempts < maxAttempts) {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const startRow = Math.floor(Math.random() * effectiveSize);
        const startCol = Math.floor(Math.random() * effectiveSize);
        
        // Check if word fits
        const endRow = startRow + dir[0] * (word.length - 1);
        const endCol = startCol + dir[1] * (word.length - 1);
        
        if (endRow >= 0 && endRow < effectiveSize && endCol >= 0 && endCol < effectiveSize) {
          // Check if path is clear
          let canPlace = true;
          for (let i = 0; i < word.length; i++) {
            const r = startRow + dir[0] * i;
            const c = startCol + dir[1] * i;
            if (gridArr[r][c] !== '' && gridArr[r][c] !== word[i]) {
              canPlace = false;
              break;
            }
          }
          
          if (canPlace) {
            // Place the word
            const wordCells = [];
            for (let i = 0; i < word.length; i++) {
              const r = startRow + dir[0] * i;
              const c = startCol + dir[1] * i;
              gridArr[r][c] = word[i];
              wordCells.push({ row: r, col: c });
            }
            positions[word] = wordCells;
            placedWords.push(word);
            placed = true;
          }
        }
        attempts++;
      }
      
      if (!placed) {
        // Force placement: find any valid position
        for (let dir of directions) {
          if (placed) break;
          for (let startRow = 0; startRow < effectiveSize && !placed; startRow++) {
            for (let startCol = 0; startCol < effectiveSize && !placed; startCol++) {
              const endRow = startRow + dir[0] * (word.length - 1);
              const endCol = startCol + dir[1] * (word.length - 1);
              
              if (endRow >= 0 && endRow < effectiveSize && endCol >= 0 && endCol < effectiveSize) {
                let canPlace = true;
                for (let i = 0; i < word.length; i++) {
                  const r = startRow + dir[0] * i;
                  const c = startCol + dir[1] * i;
                  if (gridArr[r][c] !== '' && gridArr[r][c] !== word[i]) {
                    canPlace = false;
                    break;
                  }
                }
                
                if (canPlace) {
                  const wordCells = [];
                  for (let i = 0; i < word.length; i++) {
                    const r = startRow + dir[0] * i;
                    const c = startCol + dir[1] * i;
                    gridArr[r][c] = word[i];
                    wordCells.push({ row: r, col: c });
                  }
                  positions[word] = wordCells;
                  placedWords.push(word);
                  placed = true;
                }
              }
            }
          }
        }
        
        if (!placed) {
          console.error(`[WordSearch] Could not place word: ${word}`);
          failedWords.push(word);
        }
      }
    });
    
    // Fill empty cells with random letters
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < effectiveSize; r++) {
      for (let c = 0; c < effectiveSize; c++) {
        if (gridArr[r][c] === '') {
          gridArr[r][c] = letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }
    
    return { grid: gridArr, positions, placedWords, failedWords, effectiveSize };
  };
  
  // Handle cell selection
  const handleCellMouseDown = (row, col) => {
    setIsSelecting(true);
    setSelectedCells([{ row, col }]);
  };
  
  const handleCellMouseEnter = (row, col) => {
    if (!isSelecting) return;
    
    // Only allow straight lines (horizontal, vertical, diagonal)
    const start = selectedCells[0];
    if (!start) return;
    
    const dRow = row - start.row;
    const dCol = col - start.col;
    
    // Determine direction
    let stepRow = dRow === 0 ? 0 : dRow / Math.abs(dRow);
    let stepCol = dCol === 0 ? 0 : dCol / Math.abs(dCol);
    
    // Check if it's a valid direction (straight line)
    if (Math.abs(dRow) !== Math.abs(dCol) && dRow !== 0 && dCol !== 0) {
      return; // Not a valid diagonal
    }
    
    // Build path
    const newCells = [];
    let r = start.row;
    let c = start.col;
    const maxSteps = Math.max(Math.abs(dRow), Math.abs(dCol));
    
    for (let i = 0; i <= maxSteps; i++) {
      newCells.push({ row: r, col: c });
      r += stepRow;
      c += stepCol;
    }
    
    setSelectedCells(newCells);
  };
  
  const handleCellMouseUp = () => {
    if (!isSelecting) return;
    setIsSelecting(false);
    
    // Check if selected cells form a word
    const selectedWord = selectedCells.map(c => grid[c.row]?.[c.col] || '').join('');
    const reversedWord = selectedWord.split('').reverse().join('');
    
    // Match against actually placed words
    const matchedWord = actualWords.find(w => w === selectedWord || w === reversedWord);
    
    if (matchedWord && !foundWords.includes(matchedWord)) {
      setFoundWords(prev => [...prev, matchedWord]);
      setMatchedPairs(prev => [...prev, matchedWord]);
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      toast.success(`${language === 'es' ? '¡Encontrado!' : 'Found!'} ${matchedWord}`);
      
      // Submit answer to backend
      const hint = hints.find(h => h.word === matchedWord);
      if (hint && submitAnswer) {
        submitAnswer(hint.item_id, matchedWord, true);
      }
      
      // Check if all placed words found
      if (foundWords.length + 1 >= actualWords.length) {
        setTimeout(() => handleGameComplete(), 1000);
      }
    }
    
    setSelectedCells([]);
  };
  
  const isCellSelected = (row, col) => {
    return selectedCells.some(c => c.row === row && c.col === col);
  };
  
  const isCellFound = (row, col) => {
    return foundWords.some(word => {
      const positions_for_word = wordPositions[word];
      return positions_for_word?.some(p => p.row === row && p.col === col);
    });
  };
  
  if (grid.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Badge className="mb-4 bg-emerald-500/50 text-white">
          <Search className="h-3 w-3 mr-1" />
          {language === 'es' ? 'Sopa de Letras' : 'Word Search'}
        </Badge>
        <p className="text-white/80 text-sm">
          {language === 'es' ? 'Arrastra para seleccionar palabras' : 'Drag to select words'}
        </p>
      </div>
      
      {/* Words to find - only show words that were actually placed */}
      <div className="flex flex-wrap gap-2 justify-center">
        {actualWords.map((word, idx) => (
          <Badge 
            key={idx} 
            className={`text-sm py-1 px-3 transition-all duration-300 ${
              foundWords.includes(word) 
                ? 'bg-green-500 line-through opacity-60' 
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {word}
          </Badge>
        ))}
      </div>
      
      {/* Grid */}
      <div 
        ref={gridRef}
        className="flex flex-col items-center select-none"
        onMouseLeave={() => {
          if (isSelecting) {
            setIsSelecting(false);
            setSelectedCells([]);
          }
        }}
      >
        <div 
          className="grid gap-0.5 bg-white/5 p-2 rounded-xl"
          style={{ gridTemplateColumns: `repeat(${gridSizeUsed}, minmax(0, 1fr))` }}
        >
          {grid.map((row, rowIdx) => (
            row.map((letter, colIdx) => (
              <div
                key={`${rowIdx}-${colIdx}`}
                onMouseDown={() => handleCellMouseDown(rowIdx, colIdx)}
                onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
                onMouseUp={handleCellMouseUp}
                className={`
                  w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs sm:text-sm font-bold rounded cursor-pointer
                  transition-all duration-150
                  ${isCellFound(rowIdx, colIdx) 
                    ? 'bg-green-500 text-white scale-95' 
                    : isCellSelected(rowIdx, colIdx)
                      ? 'bg-yellow-400 text-slate-900 scale-110'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }
                `}
              >
                {letter}
              </div>
            ))
          ))}
        </div>
      </div>
      
      {/* Hints - only show hints for placed words */}
      <div className="space-y-2 max-w-md mx-auto">
        <p className="text-white/60 text-sm text-center font-medium">
          {language === 'es' ? '💡 Pistas:' : '💡 Hints:'}
        </p>
        <div className="grid gap-2">
          {hints.filter(h => actualWords.includes(h.word)).slice(0, 4).map((hint, idx) => (
            <div 
              key={idx} 
              className={`bg-white/10 rounded-lg p-2 text-sm transition-all ${
                foundWords.includes(hint.word) ? 'opacity-50 line-through' : 'text-white/80'
              }`}
            >
              • {hint.hint}
            </div>
          ))}
        </div>
      </div>
      
      {/* Progress */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <span className="text-white font-medium">
            {foundWords.length} / {actualWords.length} {language === 'es' ? 'encontradas' : 'found'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Sequence Game Component - drag and drop ordering
const SequenceGameComponent = ({ session, language, setScore, setStreak, handleGameComplete, submitAnswer }) => {
  const [items, setItems] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [results, setResults] = useState(null);
  
  // Initialize items from shuffled order
  useEffect(() => {
    if (session?.game_payload?.shuffled_order && session?.game_payload?.items) {
      const orderedItems = session.game_payload.shuffled_order.map(itemId => {
        return session.game_payload.items.find(i => i.item_id === itemId);
      }).filter(Boolean);
      setItems(orderedItems);
    }
  }, [session?.game_payload]);
  
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    
    // Reorder items
    const newItems = [...items];
    const draggedItemContent = newItems[draggedItem];
    newItems.splice(draggedItem, 1);
    newItems.splice(index, 0, draggedItemContent);
    setItems(newItems);
    setDraggedItem(index);
  };
  
  const handleDragEnd = () => {
    setDraggedItem(null);
  };
  
  const moveItem = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    const newItems = [...items];
    const item = newItems[fromIndex];
    newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, item);
    setItems(newItems);
  };
  
  const checkOrder = () => {
    if (isChecked) return;
    
    // Check each item's position
    const itemResults = items.map((item, currentIndex) => ({
      ...item,
      currentPosition: currentIndex,
      isCorrect: item.correct_position === currentIndex
    }));
    
    const correctCount = itemResults.filter(r => r.isCorrect).length;
    const totalItems = items.length;
    const accuracy = Math.round((correctCount / totalItems) * 100);
    
    setResults({ items: itemResults, correctCount, totalItems, accuracy });
    setIsChecked(true);
    
    // Update score based on correct placements
    setScore(prev => prev + correctCount);
    if (correctCount === totalItems) {
      setStreak(prev => prev + 1);
      toast.success(language === 'es' ? '¡Perfecto! ¡Todo en orden!' : 'Perfect! All in order!');
    } else if (correctCount > 0) {
      toast.info(`${correctCount}/${totalItems} ${language === 'es' ? 'correctos' : 'correct'}`);
    } else {
      setStreak(0);
      toast.error(language === 'es' ? 'Intenta de nuevo' : 'Try again');
    }
    
    // Submit answers to backend
    items.forEach((item, idx) => {
      if (submitAnswer) {
        submitAnswer(item.item_id, String(idx), item.correct_position === idx);
      }
    });
    
    // Auto-complete after showing results
    setTimeout(() => handleGameComplete(), 2000);
  };
  
  const resetOrder = () => {
    // Re-shuffle
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setItems(shuffled);
    setIsChecked(false);
    setResults(null);
  };
  
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Badge className="mb-4 bg-violet-500/50 text-white">
          <GripVertical className="h-3 w-3 mr-1" />
          {language === 'es' ? 'Ordenar Secuencia' : 'Sequence Order'}
        </Badge>
        <p className="text-white/80 text-sm">
          {language === 'es' 
            ? 'Arrastra los elementos al orden correcto' 
            : 'Drag items to the correct order'}
        </p>
      </div>
      
      {/* Items to order */}
      <div className="space-y-2 max-w-lg mx-auto">
        {items.map((item, idx) => {
          const result = results?.items?.find(r => r.item_id === item.item_id);
          
          return (
            <div
              key={item.item_id}
              draggable={!isChecked}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-3 rounded-xl p-4 transition-all duration-300
                ${isChecked 
                  ? result?.isCorrect 
                    ? 'bg-green-500/30 border-2 border-green-400' 
                    : 'bg-red-500/30 border-2 border-red-400'
                  : draggedItem === idx
                    ? 'bg-violet-500/50 border-2 border-violet-400 scale-105'
                    : 'bg-white/10 border-2 border-white/30 hover:border-white/50 cursor-grab active:cursor-grabbing'
                }
              `}
            >
              {/* Position number */}
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                ${isChecked 
                  ? result?.isCorrect 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                  : 'bg-violet-500/50 text-white'
                }
              `}>
                {idx + 1}
              </div>
              
              {/* Drag handle */}
              {!isChecked && (
                <GripVertical className="h-5 w-5 text-white/40" />
              )}
              
              {/* Item text */}
              <span className="flex-1 text-white">{item.text}</span>
              
              {/* Move buttons (for touch/accessibility) */}
              {!isChecked && (
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                    onClick={() => moveItem(idx, idx - 1)}
                    disabled={idx === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                    onClick={() => moveItem(idx, idx + 1)}
                    disabled={idx === items.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Result indicator */}
              {isChecked && (
                <div className="ml-2">
                  {result?.isCorrect ? (
                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                  ) : (
                    <div className="flex items-center gap-1">
                      <XCircle className="h-6 w-6 text-red-400" />
                      <span className="text-xs text-red-300">→ {result?.correct_position + 1}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Results summary */}
      {results && (
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 rounded-full px-6 py-3 ${
            results.accuracy === 100 ? 'bg-green-500/30' : results.accuracy >= 50 ? 'bg-yellow-500/30' : 'bg-red-500/30'
          }`}>
            <Trophy className={`h-5 w-5 ${
              results.accuracy === 100 ? 'text-green-400' : results.accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'
            }`} />
            <span className="text-white font-bold text-lg">
              {results.correctCount} / {results.totalItems} {language === 'es' ? 'correctos' : 'correct'}
            </span>
            <span className="text-white/60">({results.accuracy}%)</span>
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex justify-center gap-3">
        {!isChecked ? (
          <Button
            onClick={checkOrder}
            className="bg-violet-500 hover:bg-violet-600 px-8"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {language === 'es' ? 'Verificar Orden' : 'Check Order'}
          </Button>
        ) : (
          <Button
            onClick={resetOrder}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            {language === 'es' ? 'Intentar de Nuevo' : 'Try Again'}
          </Button>
        )}
      </div>
    </div>
  );
};

// Memory Game Component - separate to prevent reshuffling on every render
const MemoryGameComponent = ({ session, language, matchedPairs, setMatchedPairs, setScore, setStreak, handleGameComplete, participantId }) => {
  const [selectedCards, setSelectedCards] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  
  // Shuffle cards ONCE when component mounts or pairs change
  const shuffledCards = useMemo(() => {
    const pairs = session?.game_payload?.pairs || [];
    const cards = pairs.flatMap((pair) => [
      { id: `${pair.pair_id}_a`, text: pair.card_a, pairId: pair.pair_id, type: 'term', itemId: pair.item_id },
      { id: `${pair.pair_id}_b`, text: pair.card_b, pairId: pair.pair_id, type: 'definition', itemId: pair.item_id }
    ]);
    // Fisher-Yates shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }, [session?.game_payload?.pairs]);
  
  const handleCardClick = (card) => {
    if (isChecking || matchedPairs.includes(card.pairId) || selectedCards.find(c => c.id === card.id)) {
      return;
    }
    
    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);
    
    if (newSelected.length === 2) {
      setIsChecking(true);
      
      // Check if match
      setTimeout(() => {
        if (newSelected[0].pairId === newSelected[1].pairId) {
          setMatchedPairs(prev => [...prev, card.pairId]);
          setScore(prev => prev + 1);
          setStreak(prev => prev + 1);
          toast.success(language === 'es' ? '¡Par encontrado!' : 'Match found!');
          
          // Check if game complete
          const totalPairs = session?.game_payload?.pairs?.length || 0;
          if (matchedPairs.length + 1 >= totalPairs) {
            setTimeout(() => handleGameComplete(), 500);
          }
        } else {
          setStreak(0);
          toast.error(language === 'es' ? 'No es par' : 'Not a match');
        }
        setSelectedCards([]);
        setIsChecking(false);
      }, 800);
    }
  };
  
  const totalPairs = session?.game_payload?.pairs?.length || 0;
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Badge className="mb-4 bg-pink-500/50 text-white">
          {language === 'es' ? 'Memoria' : 'Memory Game'}
        </Badge>
        <p className="text-white/80">
          {language === 'es' ? 'Encuentra los pares haciendo clic en las cartas' : 'Find matching pairs by clicking cards'}
        </p>
      </div>
      
      {/* Memory cards grid */}
      <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto">
        {shuffledCards.map((card) => {
          const isMatched = matchedPairs.includes(card.pairId);
          const isSelected = selectedCards.find(c => c.id === card.id);
          const isRevealed = isMatched || isSelected;
          
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              disabled={isMatched || isChecking}
              className={`aspect-square rounded-xl p-2 text-sm font-medium transition-all duration-300 transform ${
                isMatched
                  ? 'bg-green-500/40 border-green-400 text-green-100 scale-95'
                  : isSelected
                  ? 'bg-pink-500/60 border-pink-400 text-white scale-105 shadow-lg'
                  : 'bg-white/10 border-white/30 text-white hover:bg-white/20 hover:scale-102'
              } border-2 flex items-center justify-center`}
            >
              {isRevealed ? (
                <span className="text-center break-words">{card.text}</span>
              ) : (
                <span className="text-3xl">?</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="text-center space-y-2">
        <p className="text-white text-lg font-semibold">
          {matchedPairs.length} / {totalPairs} {language === 'es' ? 'pares encontrados' : 'pairs found'}
        </p>
        <Progress value={(matchedPairs.length / totalPairs) * 100} className="max-w-xs mx-auto h-3" />
      </div>
    </div>
  );
};

const PlayToLearnGame = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Session & participant info
  const [participantId, setParticipantId] = useState(searchParams.get('participant') || '');
  const [nickname, setNickname] = useState(decodeURIComponent(searchParams.get('nickname') || ''));
  const [language, setLanguage] = useState('en'); // Default to English
  
  // Session state
  const [session, setSession] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Join flow for self-paced
  const [needsToJoin, setNeedsToJoin] = useState(false);
  const [joining, setJoining] = useState(false);
  
  // Mode selection
  const [showModeSelection, setShowModeSelection] = useState(false);
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [explanation, setExplanation] = useState('');
  
  // Score tracking
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [answers, setAnswers] = useState([]);
  
  // Timer
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  
  // Game completion
  const [gameComplete, setGameComplete] = useState(false);
  const [results, setResults] = useState(null);
  
  // Track original game type to know if we started in ALL_MODES
  const [originalGameType, setOriginalGameType] = useState(null);
  
  // Matching game specific state
  const [matchingSelected, setMatchingSelected] = useState({ term: null, definition: null });
  const [matchedPairs, setMatchedPairs] = useState([]);
  
  // Flashcard state
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  
  // Time attack state
  const [typedAnswer, setTypedAnswer] = useState('');
  
  // WebSocket for live mode
  const wsRef = useRef(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);

  // Fetch session on mount
  useEffect(() => {
    fetchSession();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionId]);

  // Poll for status changes in LIVE mode lobby (fallback if WebSocket misses message)
  useEffect(() => {
    let pollInterval;
    
    if (isLiveMode && !gameStarted && session?.status === 'LOBBY') {
      pollInterval = setInterval(async () => {
        try {
          const res = await axios.get(`${API}/play-to-learn/sessions/${sessionId}`);
          if (res.data.status === 'ACTIVE') {
            console.log('[PTL] Polling detected game started!');
            setSession(res.data);
            setGameStarted(true);
            startQuestion();
            clearInterval(pollInterval);
          }
          // Update player list
          setLobbyPlayers(res.data.participants || []);
        } catch (err) {
          console.error('[PTL] Polling error:', err);
        }
      }, 2000); // Poll every 2 seconds
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isLiveMode, gameStarted, session?.status, sessionId]);

  // Timer effect
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  const fetchSession = async () => {
    try {
      const res = await axios.get(`${API}/play-to-learn/sessions/${sessionId}`);
      setSession(res.data);
      setIsLiveMode(res.data.mode === 'LIVE');
      
      // Save original game type on first load
      if (!originalGameType) {
        setOriginalGameType(res.data.game_type);
      }
      
      // Fetch assignment to get language setting
      try {
        const assignmentRes = await axios.get(`${API}/play-to-learn/assignments/${res.data.assignment_id}`);
        setAssignment(assignmentRes.data);
        // Set language from assignment
        setLanguage(assignmentRes.data.language || 'en');
      } catch (assignErr) {
        console.log('Could not fetch assignment details');
      }
      
      // Check if this is an "all_modes" session where student should pick
      const isAllModes = res.data.game_type === 'all_modes' || 
                         (res.data.allowed_game_types && res.data.allowed_game_types.length > 1 && res.data.game_type === 'all_modes');
      
      if (res.data.mode === 'LIVE') {
        // For LIVE mode, always connect to WebSocket
        connectWebSocket();
        setLobbyPlayers(res.data.participants || []);
        
        // If game is already ACTIVE, start immediately
        if (res.data.status === 'ACTIVE') {
          if (!participantId) {
            // Need to join first
            setNeedsToJoin(true);
          } else {
            setGameStarted(true);
            setCurrentQuestionIndex(res.data.current_question_index || 0);
            startQuestion();
          }
        } else if (res.data.status === 'LOBBY' && !participantId) {
          // Need to join the lobby
          setNeedsToJoin(true);
        }
      } else if (res.data.mode === 'SELF_PACED' || res.data.status === 'ACTIVE') {
        // For self-paced, check if we need to join first
        if (!participantId && res.data.mode === 'SELF_PACED') {
          // Auto-join with a generated nickname if none provided
          await autoJoinSession(res.data, isAllModes);
        } else if (isAllModes && res.data.game_type === 'all_modes') {
          // Show mode selection if "all_modes" and student hasn't selected yet
          setShowModeSelection(true);
        } else {
          setGameStarted(true);
          startQuestion();
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError(err.response?.data?.detail || 'Session not found');
    } finally {
      setLoading(false);
    }
  };

  const autoJoinSession = async (sessionData, shouldShowModeSelection = false) => {
    // Generate a nickname if not provided
    const playerNickname = nickname || `Player_${Math.random().toString(36).substring(2, 7)}`;
    setNickname(playerNickname);
    
    try {
      const res = await axios.post(`${API}/play-to-learn/sessions/${sessionId}/join`, {
        nickname: playerNickname,
        pin: sessionData.join_pin
      });
      
      setParticipantId(res.data.participant_id);
      
      // Check if student should select mode
      const allowedModes = res.data.allowed_game_types || sessionData.allowed_game_types || [];
      const isAllModes = sessionData.game_type === 'all_modes' || allowedModes.length > 1;
      
      if (isAllModes && sessionData.game_type === 'all_modes') {
        setShowModeSelection(true);
      } else {
        setGameStarted(true);
        startQuestion();
      }
    } catch (err) {
      console.error('Error auto-joining session:', err);
      // Show join form if auto-join fails
      setNeedsToJoin(true);
    }
  };

  const handleManualJoin = async () => {
    if (!nickname.trim()) {
      toast.error(language === 'en' ? 'Enter your name' : 'Ingresa tu nombre');
      return;
    }
    
    setJoining(true);
    try {
      const res = await axios.post(`${API}/play-to-learn/sessions/${sessionId}/join`, {
        nickname: nickname.trim(),
        pin: session?.join_pin
      });
      
      const newParticipantId = res.data.participant_id;
      setParticipantId(newParticipantId);
      setNeedsToJoin(false);
      
      // For LIVE mode, connect to WebSocket AFTER joining
      if (session?.mode === 'LIVE') {
        // Connect WebSocket with the new participant ID
        const ws = new WebSocket(`${WS_URL}/api/play-to-learn/ws/${sessionId}?participant_id=${newParticipantId}&role=player`);
        
        ws.onopen = () => {
          console.log('[PTL] WebSocket connected after manual join');
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        };
        
        ws.onclose = () => {
          console.log('[PTL] WebSocket disconnected');
        };
        
        wsRef.current = ws;
        
        // Check if game already started (player joined late)
        if (res.data.status === 'ACTIVE') {
          console.log('[PTL] Game already active, starting immediately');
          setGameStarted(true);
          startQuestion();
        }
        // Otherwise stay in lobby waiting for game_started message
      } else {
        // Self-paced mode
        const allowedModes = res.data.allowed_game_types || session?.allowed_game_types || [];
        const isAllModes = session?.game_type === 'all_modes';
        
        if (isAllModes) {
          setShowModeSelection(true);
        } else {
          setGameStarted(true);
          startQuestion();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error joining');
    } finally {
      setJoining(false);
    }
  };

  const connectWebSocket = () => {
    const ws = new WebSocket(`${WS_URL}/api/play-to-learn/ws/${sessionId}?participant_id=${participantId}&role=player`);
    
    ws.onopen = () => {
      console.log('[PTL] WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };
    
    ws.onclose = () => {
      console.log('[PTL] WebSocket disconnected');
    };
    
    wsRef.current = ws;
  };

  const handleWebSocketMessage = (data) => {
    console.log('[PTL] WebSocket message received:', data.type, data);
    switch (data.type) {
      case 'connected':
        setLobbyPlayers(data.participants || []);
        // If game is already active, start playing
        if (data.status === 'ACTIVE') {
          setGameStarted(true);
          setCurrentQuestionIndex(data.current_question_index || 0);
          startQuestion();
        }
        break;
      case 'player_joined':
        setLobbyPlayers(prev => [...prev, data.participant]);
        toast.success(`${data.participant.nickname} joined!`);
        break;
      case 'player_disconnected':
        setLobbyPlayers(prev => prev.filter(p => p.participant_id !== data.participant_id));
        break;
      case 'game_started':
        console.log('[PTL] Game started! Transitioning to game view...');
        toast.success(language === 'en' ? 'Game starting!' : '¡El juego comienza!');
        setGameStarted(true);
        setCurrentQuestionIndex(data.current_question_index || 0);
        // Re-fetch session to get game_payload
        fetchSession();
        break;
      case 'next_question':
        setCurrentQuestionIndex(data.current_question_index);
        resetQuestionState();
        startQuestion();
        break;
      case 'game_complete':
        handleGameComplete();
        break;
      case 'answer_result':
        handleAnswerResult(data);
        break;
      default:
        break;
    }
  };

  const startQuestion = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setTypedAnswer('');
    setFlashcardFlipped(false);
    startTimeRef.current = Date.now();
    
    const gameType = session?.game_type;
    const timeLimit = gameType === 'time_attack' ? 15 : 30;
    setTimeLeft(timeLimit);
    setTimerActive(true);
  };

  const resetQuestionState = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setTypedAnswer('');
    setFlashcardFlipped(false);
    clearInterval(timerRef.current);
    setTimerActive(false);
  };

  const handleTimeUp = () => {
    if (!showFeedback) {
      submitAnswer(null, true);
    }
  };

  const submitAnswer = async (answer, isTimeout = false) => {
    if (showFeedback) return;
    
    setTimerActive(false);
    clearInterval(timerRef.current);
    
    const timeTaken = Date.now() - (startTimeRef.current || Date.now());
    const questions = session?.game_payload?.questions || [];
    const currentQ = questions[currentQuestionIndex];
    
    if (!currentQ) return;
    
    try {
      const res = await axios.post(
        `${API}/play-to-learn/sessions/${sessionId}/submit-answer?participant_id=${participantId}`,
        {
          item_id: currentQ.item_id,
          answer: answer || '',
          time_taken_ms: timeTaken
        }
      );
      
      handleAnswerResult(res.data);
    } catch (err) {
      console.error('Error submitting answer:', err);
      // Still show feedback on error
      setShowFeedback(true);
      setIsCorrect(false);
    }
  };

  const handleAnswerResult = (result) => {
    setShowFeedback(true);
    setIsCorrect(result.is_correct);
    setExplanation(result.explanation || '');
    setScore(result.score || score);
    setStreak(result.streak || 0);
    setBestStreak(prev => Math.max(prev, result.streak || 0));
    
    setAnswers(prev => [...prev, {
      questionIndex: currentQuestionIndex,
      isCorrect: result.is_correct,
      correctAnswer: result.correct_answer
    }]);
    
    if (result.is_correct) {
      toast.success(language === 'es' ? '¡Correcto!' : 'Correct!');
    } else {
      toast.error(language === 'es' ? 'Incorrecto' : 'Incorrect');
    }
  };

  const nextQuestion = () => {
    const questions = session?.game_payload?.questions || [];
    
    if (currentQuestionIndex >= questions.length - 1) {
      handleGameComplete();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      resetQuestionState();
      startQuestion();
    }
  };

  const handleGameComplete = async () => {
    setGameComplete(true);
    
    // Use local tracking as primary source
    // Support different game payload structures
    const questions = session?.game_payload?.questions || [];
    const cards = session?.game_payload?.cards || [];
    const words = session?.game_payload?.words || [];
    const pairs = session?.game_payload?.pairs || [];
    const seqItems = session?.game_payload?.items || [];
    
    // Calculate total based on game type
    let totalQ = questions.length || cards.length;
    if (session?.game_type === 'word_search') {
      totalQ = words.length;
    } else if (session?.game_type === 'memory' || session?.game_type === 'matching') {
      totalQ = pairs.length;
    } else if (session?.game_type === 'sequence') {
      totalQ = seqItems.length;
    }
    
    // Calculate local results first
    const localResults = {
      score: score,
      total_questions: totalQ,
      accuracy_percent: totalQ > 0 ? Math.round((score / totalQ) * 100) : 0,
      best_streak: bestStreak,
      average_response_time_ms: totalTime > 0 && answers.length > 0 ? Math.round(totalTime / answers.length) : 0,
      missed_count: Math.max(0, totalQ - score)
    };
    
    // Try to submit to server
    if (participantId) {
      try {
        const res = await axios.post(
          `${API}/play-to-learn/sessions/${sessionId}/complete?participant_id=${participantId}`
        );
        // Merge server results with local tracking (prefer local for accuracy)
        setResults({
          ...res.data,
          score: localResults.score,
          total_questions: localResults.total_questions,
          accuracy_percent: localResults.accuracy_percent,
          best_streak: localResults.best_streak,
          missed_count: localResults.missed_count
        });
      } catch (err) {
        console.error('Error completing session:', err);
        setResults(localResults);
      }
    } else {
      setResults(localResults);
    }
  };

  const playAgain = async () => {
    // Create a new session with the same assignment and game type
    toast.info(language === 'en' ? 'Creating new game...' : 'Creando nuevo juego...');
    
    try {
      const res = await axios.post(`${API}/play-to-learn/sessions`, {
        assignment_id: session?.assignment_id,
        game_type: session?.game_type,
        mode: 'SELF_PACED'
      }, { withCredentials: true });
      
      // Navigate to the new session
      navigate(`/play-to-learn/game/${res.data.session_id}`);
      window.location.reload(); // Force reload to reset state
    } catch (err) {
      toast.error(language === 'en' ? 'Error creating new game' : 'Error al crear nuevo juego');
    }
  };

  const tryDifferentMode = () => {
    // Reset game state when trying a different mode
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAnswers([]);
    setMatchedPairs([]);
    setCurrentQuestionIndex(0);
    setTotalTime(0);
    
    // For ALL_MODES sessions, show mode selection to pick a new mode within same session
    // For single-mode sessions, show mode selection to create a new session
    if (session?.game_type === 'all_modes' || originalGameType === 'all_modes') {
      setShowModeSelection(true);
      setGameComplete(false);
    } else {
      setShowModeSelection(true);
      setGameComplete(false);
    }
  };

  const selectNewMode = async (newGameType) => {
    // Reset game state
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAnswers([]);
    setMatchedPairs([]);
    setCurrentQuestionIndex(0);
    setTotalTime(0);
    
    // If we're in an ALL_MODES session, use the select-mode endpoint to stay in same session
    if (session?.game_type === 'all_modes' || originalGameType === 'all_modes') {
      try {
        const res = await axios.post(
          `${API}/play-to-learn/sessions/${sessionId}/select-mode`,
          {
            game_type: newGameType,
            participant_id: participantId
          }
        );
        
        // Update session with new game payload
        setSession(prev => ({
          ...prev,
          game_type: newGameType,
          game_payload: res.data.game_payload
        }));
        
        setShowModeSelection(false);
        setGameComplete(false);
        toast.success(language === 'en' ? `Switched to ${newGameType.replace('_', ' ')}` : `Cambiado a ${newGameType.replace('_', ' ')}`);
      } catch (err) {
        console.error('Error switching mode:', err);
        toast.error(language === 'en' ? 'Error switching mode' : 'Error al cambiar modo');
      }
    } else {
      // For non-ALL_MODES sessions, create a new session
      toast.info(language === 'en' ? 'Creating new game...' : 'Creando nuevo juego...');
      
      try {
        const res = await axios.post(`${API}/play-to-learn/sessions`, {
          assignment_id: session?.assignment_id,
          game_type: newGameType,
          mode: 'SELF_PACED'
        }, { withCredentials: true });
        
        // Navigate to the new session
        navigate(`/play-to-learn/game/${res.data.session_id}`);
        window.location.reload(); // Force reload to reset state
      } catch (err) {
        toast.error(language === 'en' ? 'Error creating new game' : 'Error al crear nuevo juego');
      }
    }
  };

  // Handle matching game
  const handleMatchingSelect = (type, item) => {
    if (matchedPairs.includes(item.item_id)) return;
    
    if (type === 'term') {
      setMatchingSelected(prev => ({ ...prev, term: item }));
    } else {
      setMatchingSelected(prev => ({ ...prev, definition: item }));
    }
  };

  // Check matching pair
  useEffect(() => {
    if (matchingSelected.term && matchingSelected.definition) {
      const pairs = session?.game_payload?.pairs || [];
      const isMatch = pairs.some(
        p => p.term_id === matchingSelected.term.item_id && 
             p.definition_id === matchingSelected.definition.item_id
      );
      
      if (isMatch) {
        setMatchedPairs(prev => [...prev, matchingSelected.term.item_id, matchingSelected.definition.item_id]);
        setScore(prev => prev + 1);
        setStreak(prev => prev + 1);
        toast.success(language === 'es' ? '¡Correcto!' : 'Correct!');
      } else {
        setStreak(0);
        toast.error(language === 'es' ? 'Intenta de nuevo' : 'Try again');
      }
      
      setTimeout(() => setMatchingSelected({ term: null, definition: null }), 300);
    }
  }, [matchingSelected]);

  // Check if matching complete
  useEffect(() => {
    const pairs = session?.game_payload?.pairs || [];
    if (session?.game_type === 'matching' && matchedPairs.length === pairs.length * 2) {
      handleGameComplete();
    }
  }, [matchedPairs]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-white animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <Card className="max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">{language === 'en' ? 'Error' : 'Error'}</h2>
            <p className="text-white/70">{error}</p>
            <Button onClick={() => navigate('/play-to-learn')} className="mt-4">
              {language === 'en' ? 'Back to Home' : 'Volver al Inicio'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Need to join (enter nickname)
  if (needsToJoin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <CardHeader className="text-center">
            <Gamepad2 className="h-12 w-12 mx-auto text-yellow-400 mb-2" />
            <CardTitle>{language === 'en' ? 'Enter Your Name' : 'Ingresa tu Nombre'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={language === 'en' ? 'Your nickname...' : 'Tu nombre...'}
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
              onKeyPress={(e) => e.key === 'Enter' && handleManualJoin()}
            />
            <Button
              onClick={handleManualJoin}
              disabled={joining || !nickname.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
            >
              {joining ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {language === 'en' ? 'Start Playing' : 'Comenzar a Jugar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mode selection screen
  if (showModeSelection) {
    const gameModes = [
      { id: 'quiz', icon: Brain, name: language === 'en' ? 'Classic Quiz' : 'Quiz Clásico', color: 'from-purple-500 to-indigo-600', desc: language === 'en' ? 'Multiple choice questions' : 'Preguntas de opción múltiple' },
      { id: 'time_attack', icon: Zap, name: language === 'en' ? 'Time Attack' : 'Ataque de Tiempo', color: 'from-orange-500 to-red-600', desc: language === 'en' ? 'Answer quickly!' : '¡Responde rápido!' },
      { id: 'matching', icon: Target, name: language === 'en' ? 'Matching' : 'Emparejamiento', color: 'from-green-500 to-teal-600', desc: language === 'en' ? 'Connect pairs' : 'Conecta pares' },
      { id: 'flashcard', icon: Sparkles, name: language === 'en' ? 'Flashcards' : 'Tarjetas Flash', color: 'from-pink-500 to-rose-600', desc: language === 'en' ? 'Study cards' : 'Tarjetas de estudio' },
      { id: 'true_false', icon: CheckCircle2, name: language === 'en' ? 'True/False' : 'Verdadero/Falso', color: 'from-blue-500 to-cyan-600', desc: language === 'en' ? 'Is it true?' : '¿Es verdadero?' },
      { id: 'fill_blank', icon: Target, name: language === 'en' ? 'Fill in Blank' : 'Completar', color: 'from-amber-500 to-yellow-600', desc: language === 'en' ? 'Complete sentences' : 'Completa oraciones' },
      { id: 'word_search', icon: Target, name: language === 'en' ? 'Word Search' : 'Sopa de Letras', color: 'from-emerald-500 to-green-600', desc: language === 'en' ? 'Find words' : 'Encuentra palabras' },
      { id: 'memory', icon: Brain, name: language === 'en' ? 'Memory Game' : 'Juego de Memoria', color: 'from-violet-500 to-purple-600', desc: language === 'en' ? 'Match cards' : 'Empareja cartas' }
    ];
    
    // Filter to allowed modes if available
    const allowedModes = session?.allowed_game_types || assignment?.allowed_game_types || ['quiz', 'time_attack', 'matching', 'flashcard', 'true_false', 'fill_blank', 'word_search', 'memory'];
    const availableModes = gameModes.filter(m => allowedModes.includes(m.id));
    
    // Check if this is initial selection (game_type is 'all_modes') or post-game selection
    const isInitialSelection = session?.game_type === 'all_modes';
    
    // Function to handle initial mode selection
    const handleInitialModeSelect = async (modeId) => {
      toast.info(language === 'en' ? 'Loading game...' : 'Cargando juego...');
      try {
        const res = await axios.post(`${API}/play-to-learn/sessions/${sessionId}/select-mode`, {
          game_type: modeId,
          participant_id: participantId
        });
        
        // Update session with new payload
        setSession(prev => ({
          ...prev,
          game_type: modeId,
          game_payload: res.data.game_payload
        }));
        
        setShowModeSelection(false);
        setGameStarted(true);
        startQuestion();
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Error selecting mode');
      }
    };
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <CardHeader className="text-center">
            <Sparkles className="h-12 w-12 mx-auto text-yellow-400 mb-2" />
            <CardTitle className="text-2xl">
              {language === 'en' ? 'Choose How to Play!' : '¡Elige Cómo Jugar!'}
            </CardTitle>
            <p className="text-white/70 text-sm mt-2">
              {assignment?.topic || session?.topic || ''}
            </p>
            {nickname && (
              <Badge className="mt-2 bg-purple-500/50">{nickname}</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {availableModes.map((mode) => (
                <Button
                  key={mode.id}
                  onClick={() => isInitialSelection ? handleInitialModeSelect(mode.id) : selectNewMode(mode.id)}
                  className={`w-full bg-gradient-to-r ${mode.color} py-8 flex-col h-auto gap-1 hover:scale-105 transition-transform`}
                  disabled={!isInitialSelection && mode.id === session?.game_type}
                >
                  <mode.icon className="h-8 w-8" />
                  <span className="text-sm font-bold">{mode.name}</span>
                  <span className="text-xs opacity-80">{mode.desc}</span>
                </Button>
              ))}
            </div>
            {!isInitialSelection && (
              <Button
                variant="ghost"
                onClick={() => {
                  setShowModeSelection(false);
                  setGameComplete(true);
                }}
                className="w-full text-white/70 hover:text-white hover:bg-white/10 mt-4"
              >
                {language === 'en' ? 'Back to Results' : 'Volver a Resultados'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Lobby state (Live mode waiting)
  if (isLiveMode && !gameStarted && session?.status === 'LOBBY') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <CardHeader className="text-center">
            <Gamepad2 className="h-16 w-16 mx-auto text-yellow-400 mb-4" />
            <CardTitle className="text-2xl">
              {language === 'es' ? 'Sala de Espera' : 'Waiting Room'}
            </CardTitle>
            {nickname && (
              <Badge className="mt-2 bg-green-500">{nickname}</Badge>
            )}
            <p className="text-white/70 mt-2">
              {language === 'es' ? 'Esperando que el maestro inicie el juego...' : 'Waiting for teacher to start the game...'}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/70">{language === 'es' ? 'Jugadores:' : 'Players:'}</span>
                <Badge className="bg-purple-500">{lobbyPlayers.length}</Badge>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {lobbyPlayers.map((player, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                      {player.nickname?.charAt(0).toUpperCase()}
                    </div>
                    <span>{player.nickname}</span>
                    {player.nickname === nickname && (
                      <Badge className="ml-auto text-xs bg-yellow-500/50">
                        {language === 'es' ? 'Tú' : 'You'}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/50 text-sm">
                  {language === 'es' ? 'Conectado al juego' : 'Connected to game'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results screen
  if (gameComplete && results) {
    const accuracyColor = results.accuracy_percent >= 80 ? 'text-green-400' : 
                         results.accuracy_percent >= 60 ? 'text-yellow-400' : 'text-red-400';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-white/10 backdrop-blur-xl border-white/20 text-white overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-2" />
            <h1 className="text-3xl font-bold">
              {language === 'es' ? '¡Completado!' : 'Complete!'}
            </h1>
          </div>
          
          <CardContent className="p-6 space-y-6">
            {/* Score */}
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">
                {results.score}/{results.total_questions}
              </div>
              <div className={`text-2xl font-semibold ${accuracyColor}`}>
                {results.accuracy_percent}% {language === 'es' ? 'Precisión' : 'Accuracy'}
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <Flame className="h-8 w-8 mx-auto text-orange-400 mb-1" />
                <div className="text-2xl font-bold">{results.best_streak || bestStreak}</div>
                <div className="text-sm text-white/70">{language === 'es' ? 'Mejor Racha' : 'Best Streak'}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <Timer className="h-8 w-8 mx-auto text-blue-400 mb-1" />
                <div className="text-2xl font-bold">
                  {Math.round((results.average_response_time_ms || 0) / 1000)}s
                </div>
                <div className="text-sm text-white/70">{language === 'es' ? 'Tiempo Promedio' : 'Avg Time'}</div>
              </div>
            </div>
            
            {/* Areas to practice */}
            {results.missed_count > 0 && (
              <div className="bg-red-500/20 rounded-xl p-4">
                <p className="text-sm text-center">
                  {language === 'es' 
                    ? `${results.missed_count} pregunta(s) para repasar`
                    : `${results.missed_count} question(s) to review`}
                </p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={playAgain}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 py-6 text-lg"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                {language === 'es' ? 'Jugar de Nuevo' : 'Play Again'}
              </Button>
              
              <Button
                onClick={tryDifferentMode}
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/10 py-6"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {language === 'es' ? 'Probar Otro Modo' : 'Try Different Mode'}
              </Button>
              
              <Button
                onClick={() => navigate('/play-to-learn')}
                variant="ghost"
                className="w-full text-white/70 hover:text-white hover:bg-white/10"
              >
                {language === 'es' ? 'Volver al Inicio' : 'Back to Home'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main game view
  const questions = session?.game_payload?.questions || [];
  const cards = session?.game_payload?.cards || [];
  const currentQ = questions[currentQuestionIndex];
  const currentCard = cards[currentQuestionIndex];
  const totalQuestions = questions.length || cards.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-4 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Progress Header */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20">{session?.game_type?.toUpperCase()}</Badge>
                <span className="font-medium">{nickname}</span>
              </div>
              <span className="text-sm">{currentQuestionIndex + 1} / {totalQuestions}</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
            <div className="flex items-center justify-between mt-2 text-sm">
              <div className="flex items-center gap-4">
                <span><Trophy className="h-4 w-4 inline mr-1" /> {score}</span>
                <span><Flame className="h-4 w-4 inline mr-1" /> {streak}</span>
              </div>
              {timerActive && (
                <div className={`flex items-center gap-1 ${timeLeft <= 5 ? 'text-red-300 animate-pulse' : ''}`}>
                  <Clock className="h-4 w-4" />
                  <span className="font-mono">{timeLeft}s</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Game Content */}
        <Card className="border-2 border-purple-300/30 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-6 min-h-[400px]">
            {/* Quiz Mode */}
            {session?.game_type === 'quiz' && currentQ && (
              <div className="space-y-6">
                <div className="text-center">
                  <Badge className="mb-4 bg-purple-500/50 text-white">
                    {language === 'es' ? 'Pregunta' : 'Question'} {currentQuestionIndex + 1}
                  </Badge>
                  <h3 className="text-xl md:text-2xl font-semibold text-white">
                    {currentQ.question}
                  </h3>
                </div>
                
                <div className="grid gap-3">
                  {currentQ.options?.map((option, idx) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrectAnswer = option === currentQ.correct_answer;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (!showFeedback) {
                            setSelectedAnswer(option);
                            submitAnswer(option);
                          }
                        }}
                        disabled={showFeedback}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all text-white ${
                          showFeedback
                            ? isCorrectAnswer
                              ? 'border-green-400 bg-green-500/30'
                              : isSelected
                              ? 'border-red-400 bg-red-500/30'
                              : 'border-white/20 opacity-50'
                            : 'border-white/30 hover:border-purple-400 hover:bg-purple-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            showFeedback
                              ? isCorrectAnswer
                                ? 'bg-green-400 text-green-900'
                                : isSelected
                                ? 'bg-red-400 text-red-900'
                                : 'bg-white/20'
                              : 'bg-white/20'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="flex-1 font-medium">{option}</span>
                          {showFeedback && isCorrectAnswer && (
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                          )}
                          {showFeedback && isSelected && !isCorrectAnswer && (
                            <XCircle className="h-5 w-5 text-red-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {showFeedback && (
                  <div className="space-y-4">
                    {explanation && (
                      <div className="bg-white/10 rounded-xl p-4 text-white/80 text-sm">
                        {explanation}
                      </div>
                    )}
                    <Button
                      onClick={nextQuestion}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 py-6"
                    >
                      {currentQuestionIndex < totalQuestions - 1 ? (
                        <>{language === 'es' ? 'Siguiente' : 'Next'} <ArrowRight className="ml-2 h-5 w-5" /></>
                      ) : (
                        <>{language === 'es' ? 'Ver Resultados' : 'See Results'} <Trophy className="ml-2 h-5 w-5" /></>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Time Attack Mode */}
            {session?.game_type === 'time_attack' && currentQ && (
              <div className="space-y-6">
                <div className="text-center">
                  <Zap className="h-10 w-10 mx-auto text-orange-400 mb-2" />
                  <h3 className="text-xl md:text-2xl font-semibold text-white">
                    {currentQ.question}
                  </h3>
                </div>
                
                {!showFeedback ? (
                  <div className="flex gap-2">
                    <Input
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      placeholder={language === 'es' ? 'Escribe tu respuesta...' : 'Type your answer...'}
                      className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && typedAnswer.trim()) {
                          setSelectedAnswer(typedAnswer);
                          submitAnswer(typedAnswer);
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      onClick={() => {
                        setSelectedAnswer(typedAnswer);
                        submitAnswer(typedAnswer);
                      }}
                      disabled={!typedAnswer.trim()}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`text-center p-4 rounded-xl ${isCorrect ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                      {isCorrect ? (
                        <CheckCircle2 className="h-12 w-12 mx-auto text-green-400 mb-2" />
                      ) : (
                        <XCircle className="h-12 w-12 mx-auto text-red-400 mb-2" />
                      )}
                      <p className="text-white font-medium">
                        {language === 'es' ? 'Respuesta correcta:' : 'Correct answer:'} {currentQ.correct_answer}
                      </p>
                    </div>
                    <Button
                      onClick={nextQuestion}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 py-6"
                    >
                      {currentQuestionIndex < totalQuestions - 1 ? (
                        <>{language === 'es' ? 'Siguiente' : 'Next'} <ArrowRight className="ml-2 h-5 w-5" /></>
                      ) : (
                        <>{language === 'es' ? 'Ver Resultados' : 'See Results'}</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Matching Mode */}
            {session?.game_type === 'matching' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white text-center">
                  {language === 'es' ? 'Empareja los términos' : 'Match the terms'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Terms */}
                  <div className="space-y-2">
                    <p className="text-sm text-white/70 text-center">
                      {language === 'es' ? 'Términos' : 'Terms'}
                    </p>
                    {session.game_payload?.terms?.map((term, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleMatchingSelect('term', term)}
                        disabled={matchedPairs.includes(term.item_id)}
                        className={`w-full p-3 rounded-lg border-2 text-sm text-white transition-all ${
                          matchedPairs.includes(term.item_id)
                            ? 'bg-green-500/30 border-green-400 opacity-60'
                            : matchingSelected.term?.item_id === term.item_id
                            ? 'bg-purple-500/30 border-purple-400'
                            : 'border-white/30 hover:border-purple-400'
                        }`}
                      >
                        {term.text}
                      </button>
                    ))}
                  </div>
                  {/* Definitions */}
                  <div className="space-y-2">
                    <p className="text-sm text-white/70 text-center">
                      {language === 'es' ? 'Definiciones' : 'Definitions'}
                    </p>
                    {session.game_payload?.definitions?.map((def, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleMatchingSelect('definition', def)}
                        disabled={matchedPairs.includes(def.item_id)}
                        className={`w-full p-3 rounded-lg border-2 text-sm text-white transition-all ${
                          matchedPairs.includes(def.item_id)
                            ? 'bg-green-500/30 border-green-400 opacity-60'
                            : matchingSelected.definition?.item_id === def.item_id
                            ? 'bg-pink-500/30 border-pink-400'
                            : 'border-white/30 hover:border-pink-400'
                        }`}
                      >
                        {def.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Flashcard Mode */}
            {session?.game_type === 'flashcard' && currentCard && (
              <div className="flex flex-col items-center space-y-6">
                <div 
                  onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                  className="w-full max-w-md h-64 cursor-pointer perspective-1000"
                >
                  <div 
                    className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
                      flashcardFlipped ? 'rotate-y-180' : ''
                    }`}
                    style={{ 
                      transformStyle: 'preserve-3d',
                      transform: flashcardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                  >
                    {/* Front */}
                    <div 
                      className="absolute w-full h-full rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-6 flex flex-col items-center justify-center text-white shadow-lg"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <p className="text-sm uppercase tracking-wider mb-2 opacity-70">
                        {language === 'es' ? 'Término' : 'Term'}
                      </p>
                      <p className="text-xl font-bold text-center">{currentCard.front}</p>
                      <p className="text-sm mt-4 opacity-70">
                        {language === 'es' ? '(Toca para voltear)' : '(Tap to flip)'}
                      </p>
                    </div>
                    {/* Back */}
                    <div 
                      className="absolute w-full h-full rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 p-6 flex flex-col items-center justify-center text-white shadow-lg"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <p className="text-sm uppercase tracking-wider mb-2 opacity-70">
                        {language === 'es' ? 'Definición' : 'Definition'}
                      </p>
                      <p className="text-xl font-bold text-center">{currentCard.back}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={() => {
                      setScore(prev => prev);
                      setStreak(0);
                      nextQuestion();
                    }}
                    variant="outline"
                    className="border-red-400 text-red-400 hover:bg-red-500/20"
                  >
                    {language === 'es' ? 'No lo sabía' : "Didn't know"}
                  </Button>
                  <Button 
                    onClick={() => {
                      setScore(prev => prev + 1);
                      setStreak(prev => prev + 1);
                      setBestStreak(prev => Math.max(prev, streak + 1));
                      nextQuestion();
                    }}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {language === 'es' ? '¡Lo sabía!' : 'Got it!'}
                  </Button>
                </div>
              </div>
            )}

            {/* True/False Mode */}
            {session?.game_type === 'true_false' && currentQ && (
              <div className="space-y-6">
                <div className="text-center">
                  <Badge className="mb-4 bg-cyan-500/50 text-white">
                    {language === 'es' ? 'Verdadero o Falso' : 'True or False'}
                  </Badge>
                  <h3 className="text-xl md:text-2xl font-semibold text-white">
                    {currentQ.statement || currentQ.question}
                  </h3>
                </div>
                
                {!showFeedback ? (
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => {
                        setSelectedAnswer('true');
                        submitAnswer('true');
                      }}
                      className="bg-green-500 hover:bg-green-600 py-8 px-12 text-xl"
                    >
                      <CheckCircle2 className="h-6 w-6 mr-2" />
                      {language === 'es' ? 'Verdadero' : 'True'}
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedAnswer('false');
                        submitAnswer('false');
                      }}
                      className="bg-red-500 hover:bg-red-600 py-8 px-12 text-xl"
                    >
                      <XCircle className="h-6 w-6 mr-2" />
                      {language === 'es' ? 'Falso' : 'False'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`text-center p-4 rounded-xl ${isCorrect ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                      {isCorrect ? (
                        <CheckCircle2 className="h-12 w-12 mx-auto text-green-400 mb-2" />
                      ) : (
                        <XCircle className="h-12 w-12 mx-auto text-red-400 mb-2" />
                      )}
                      <p className="text-white font-medium">
                        {language === 'es' ? 'Respuesta correcta:' : 'Correct answer:'} {currentQ.is_true ? (language === 'es' ? 'Verdadero' : 'True') : (language === 'es' ? 'Falso' : 'False')}
                      </p>
                    </div>
                    {explanation && (
                      <div className="bg-white/10 rounded-xl p-4 text-white/80 text-sm">
                        {explanation}
                      </div>
                    )}
                    <Button
                      onClick={nextQuestion}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 py-6"
                    >
                      {currentQuestionIndex < totalQuestions - 1 ? (
                        <>{language === 'es' ? 'Siguiente' : 'Next'} <ArrowRight className="ml-2 h-5 w-5" /></>
                      ) : (
                        <>{language === 'es' ? 'Ver Resultados' : 'See Results'} <Trophy className="ml-2 h-5 w-5" /></>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Fill in the Blank Mode */}
            {session?.game_type === 'fill_blank' && currentQ && (
              <div className="space-y-6">
                <div className="text-center">
                  <Badge className="mb-4 bg-orange-500/50 text-white">
                    {language === 'es' ? 'Completar' : 'Fill in the Blank'}
                  </Badge>
                  <h3 className="text-xl md:text-2xl font-semibold text-white">
                    {currentQ.sentence || currentQ.question}
                  </h3>
                  {currentQ.hint && (
                    <p className="text-white/60 mt-2 text-sm">
                      {language === 'es' ? 'Pista:' : 'Hint:'} {currentQ.hint}
                    </p>
                  )}
                </div>
                
                {!showFeedback ? (
                  <div className="flex gap-2 max-w-md mx-auto">
                    <Input
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      placeholder={language === 'es' ? 'Escribe tu respuesta...' : 'Type your answer...'}
                      className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && typedAnswer.trim()) {
                          setSelectedAnswer(typedAnswer);
                          submitAnswer(typedAnswer);
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      onClick={() => {
                        setSelectedAnswer(typedAnswer);
                        submitAnswer(typedAnswer);
                      }}
                      disabled={!typedAnswer.trim()}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`text-center p-4 rounded-xl ${isCorrect ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                      {isCorrect ? (
                        <CheckCircle2 className="h-12 w-12 mx-auto text-green-400 mb-2" />
                      ) : (
                        <XCircle className="h-12 w-12 mx-auto text-red-400 mb-2" />
                      )}
                      <p className="text-white font-medium">
                        {language === 'es' ? 'Respuesta correcta:' : 'Correct answer:'} {currentQ.blank_answer || currentQ.correct_answer}
                      </p>
                    </div>
                    {explanation && (
                      <div className="bg-white/10 rounded-xl p-4 text-white/80 text-sm">
                        {explanation}
                      </div>
                    )}
                    <Button
                      onClick={nextQuestion}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 py-6"
                    >
                      {currentQuestionIndex < totalQuestions - 1 ? (
                        <>{language === 'es' ? 'Siguiente' : 'Next'} <ArrowRight className="ml-2 h-5 w-5" /></>
                      ) : (
                        <>{language === 'es' ? 'Ver Resultados' : 'See Results'} <Trophy className="ml-2 h-5 w-5" /></>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Word Search Mode */}
            {session?.game_type === 'word_search' && (
              <WordSearchGameComponent 
                session={session}
                language={language}
                matchedPairs={matchedPairs}
                setMatchedPairs={setMatchedPairs}
                setScore={setScore}
                setStreak={setStreak}
                handleGameComplete={handleGameComplete}
                submitAnswer={(itemId, answer, isCorrect) => {
                  // Submit to backend
                  axios.post(`${API}/play-to-learn/sessions/${session.session_id}/submit-answer?participant_id=${participantId}`, {
                    item_id: itemId,
                    answer: answer,
                    time_taken_ms: 0
                  }, { withCredentials: true }).catch(console.error);
                }}
              />
            )}

            {/* Sequence Mode */}
            {session?.game_type === 'sequence' && (
              <SequenceGameComponent 
                session={session}
                language={language}
                setScore={setScore}
                setStreak={setStreak}
                handleGameComplete={handleGameComplete}
                submitAnswer={(itemId, answer, isCorrect) => {
                  // Submit to backend
                  axios.post(`${API}/play-to-learn/sessions/${session.session_id}/submit-answer?participant_id=${participantId}`, {
                    item_id: itemId,
                    answer: answer,
                    time_taken_ms: 0
                  }, { withCredentials: true }).catch(console.error);
                }}
              />
            )}

            {/* Memory Game Mode */}
            {session?.game_type === 'memory' && (
              <MemoryGameComponent 
                session={session}
                language={language}
                matchedPairs={matchedPairs}
                setMatchedPairs={setMatchedPairs}
                setScore={setScore}
                setStreak={setStreak}
                handleGameComplete={handleGameComplete}
              />
            )}

            {/* Fallback for unknown game types */}
            {!['quiz', 'time_attack', 'matching', 'flashcard', 'true_false', 'fill_blank', 'word_search', 'sequence', 'memory', 'all_modes'].includes(session?.game_type) && (
              <div className="text-center text-white/60 py-12">
                <Gamepad2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>{language === 'es' ? 'Modo de juego no soportado' : 'Game mode not supported'}: {session?.game_type}</p>
                <Button onClick={() => navigate('/play-to-learn')} className="mt-4">
                  {language === 'es' ? 'Volver' : 'Go Back'}
                </Button>
              </div>
            )}

            {/* Mode Selection Required - when game_type is all_modes */}
            {session?.game_type === 'all_modes' && !showModeSelection && (
              <div className="text-center py-12 space-y-4">
                <Sparkles className="h-16 w-16 mx-auto text-yellow-400" />
                <h3 className="text-2xl font-bold text-white">
                  {language === 'es' ? '¡Elige un modo de juego!' : 'Choose a game mode!'}
                </h3>
                <Button 
                  onClick={() => setShowModeSelection(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-6 text-xl"
                >
                  {language === 'es' ? 'Seleccionar Modo' : 'Select Mode'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session info footer */}
        <div className="text-center text-white/40 text-xs">
          <p>Session: {sessionId?.substring(0, 15)}... | QS: {session?.question_set_id?.substring(0, 10)}...</p>
        </div>
      </div>
    </div>
  );
};

export default PlayToLearnGame;
