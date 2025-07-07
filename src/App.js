import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Info,
  Play,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  History,
} from "lucide-react";

const EarleyParserInterface = () => {
  const [sentence, setSentence] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [userItems, setUserItems] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isCorrect, setIsCorrect] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [parsingComplete, setParsingComplete] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentItemInput, setCurrentItemInput] = useState("");
  const [completedItems, setCompletedItems] = useState([]);
  const [itemFeedback, setItemFeedback] = useState("");
  const [stepHistory, setStepHistory] = useState([]);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  // Dictionary và Grammar từ file PDF
  const dictionary = {
    a: ["det"],
    am: ["v"],
    an: ["det"],
    book: ["noun"],
    brown: ["noun", "adj"],
    can: ["noun", "v", "aux"],
    chair: ["noun"],
    class: ["noun"],
    dog: ["noun"],
    fish: ["noun", "v"],
    fox: ["noun"],
    house: ["noun"],
    i: ["pron"],
    in: ["prep"],
    jump: ["v"],
    lazy: ["adj"],
    man: ["noun"],
    new: ["adj"],
    old: ["adj"],
    on: ["prep"],
    over: ["prep"],
    read: ["v"],
    room: ["noun"],
    round: ["noun", "adj", "v", "prep", "adv"],
    sat: ["v"],
    school: ["noun"],
    sit: ["v"],
    stay: ["v"],
    student: ["noun"],
    the: ["det"],
    they: ["pron"],
    we: ["pron"],
    write: ["v"],
    young: ["adj"],
  };

  const grammar = [
    "S → NP VP",
    "S → NP VP PP",
    "NP → pron",
    "NP → det NP3",
    "NP3 → adj NP3",
    "NP3 → noun",
    "NP3 → noun PP",
    "NP3 → det NP3",
    "PP → prep NP2",
    "NP2 → det NP3",
    "VP → VP1",
    "VP → aux VP1",
    "VP1 → v",
    "VP1 → v NP3",
  ];

  const sampleSentences = [
    "i can write",
    "i can fish",
    "i can write a book",
    "they can write a",
  ];

  // Hàm tạo initial items cho I0
  const generateInitialItems = () => {
    return [
      "S → .NP VP, 0",
      "S → .NP VP PP, 0",
      "NP → .pron, 0",
      "NP → .det NP3, 0",
    ];
  };

  // Hàm tính toán expected items cho từng step
  const calculateExpectedItems = (words, step) => {
    if (step === 0) return generateInitialItems();

    // Simplified logic - trong thực tế cần implement đầy đủ Earley algorithm
    const word = words[step - 1].toLowerCase();
    const pos = dictionary[word] || [];

    let items = [];

    if (step === 1 && pos.includes("pron")) {
      items = [
        "NP → pron ., 0",
        "S → NP .VP PP, 0",
        "S → NP .VP, 0",
        "VP → .VP1, 1",
        "VP → .aux VP1, 1",
        "VP1 → .v, 1",
        "VP1 → .v NP3, 1",
      ];
    } else if (step === 2 && pos.includes("aux")) {
      items = [
        "VP → aux .VP1, 1",
        "VP1 → v ., 1",
        "VP1 → v .NP3, 1",
        "VP1 → .v, 2",
        "VP1 → .v NP3, 2",
        "NP3 → .adj NP3, 2",
        "NP3 → .noun, 2",
        "NP3 → .noun PP, 2",
        "NP3 → .det NP3, 2",
        "VP → VP1 ., 1",
        "S → NP VP ., 0",
        "S → NP VP .PP, 0",
        "PP → .prep NP2, 2",
      ];
    } else if (step === 3 && pos.includes("v")) {
      items = [
        "VP1 → v ., 2",
        "VP1 → v .NP3, 2",
        "NP3 → .adj NP3, 3",
        "NP3 → .noun, 3",
        "NP3 → .noun PP, 3",
        "NP3 → .det NP3, 3",
        "VP → aux VP1 ., 1",
        "S → NP VP ., 0",
        "S → NP VP .PP, 0",
        "PP → .prep NP2, 3",
      ];
    } else if (step === 4 && pos.includes("det")) {
      items = [
        "NP3 → det .NP3, 3",
        "NP3 → .adj NP3, 4",
        "NP3 → .noun, 4",
        "NP3 → .noun PP, 4",
        "NP3 → .det NP3, 4",
      ];
    }

    return items;
  };

  // Hàm chuẩn hóa item để so sánh
  const normalizeItem = (item) => {
    return item
      .trim()
      .replace(/\s+/g, " ") // Thay nhiều khoảng trắng thành 1
      .replace(/\s*->\s*/g, "→") // Chuẩn hóa mũi tên
      .replace(/\s*→\s*/g, "→") // Loại bỏ khoảng trắng quanh mũi tên
      .replace(/\s*\.\s*/g, ".") // Loại bỏ khoảng trắng quanh dấu chấm
      .replace(/\s*,\s*/g, ",") // Loại bỏ khoảng trắng quanh dấu phẩy
      .toLowerCase();
  };

  const checkCurrentItem = () => {
    const words = sentence.trim().split(/\s+/);
    const expectedItems = calculateExpectedItems(words, currentStep);

    if (currentItemIndex >= expectedItems.length) {
      setItemFeedback("❌ Đã hết items cho bước này!");
      return;
    }

    const expectedItem = expectedItems[currentItemIndex];
    const userItem = currentItemInput.trim();

    // So sánh sau khi chuẩn hóa
    const normalizedExpected = normalizeItem(expectedItem);
    const normalizedUser = normalizeItem(userItem);

    if (normalizedUser === normalizedExpected) {
      setItemFeedback("✅ Chính xác!");
      setCompletedItems([...completedItems, userItem]); // Lưu input gốc của user
      setCurrentItemInput("");

      if (currentItemIndex + 1 >= expectedItems.length) {
        // Hoàn thành bước này
        setTimeout(() => {
          setItemFeedback("🎉 Hoàn thành bước I" + currentStep + "!");

          // Lưu vào history
          const stepData = {
            step: currentStep,
            word: currentStep > 0 ? words[currentStep - 1] : "Start",
            items: [...completedItems, userItem],
            completed: true,
          };

          setStepHistory((prev) => {
            const newHistory = [...prev];
            const existingIndex = newHistory.findIndex(
              (h) => h.step === currentStep
            );
            if (existingIndex >= 0) {
              newHistory[existingIndex] = stepData;
            } else {
              newHistory.push(stepData);
            }
            return newHistory;
          });

          setTimeout(() => {
            if (currentStep < words.length) {
              // Chuyển sang bước tiếp theo
              setCurrentStep(currentStep + 1);
              setCurrentItemIndex(0);
              setCompletedItems([]);
              setItemFeedback("");
            } else {
              setParsingComplete(true);
              setFeedback(
                "🎉 Hoàn thành! Bạn đã phân tích thành công câu này."
              );
            }
          }, 1000);
        }, 1000);
      } else {
        // Chuyển sang item tiếp theo
        setTimeout(() => {
          setCurrentItemIndex(currentItemIndex + 1);
          setItemFeedback("");
        }, 1000);
      }
    } else {
      setItemFeedback(`❌ Sai rồi! Mong đợi: "${expectedItem}"`);
    }
  };

  const skipCurrentItem = () => {
    if (isProcessing) return; // Ngăn chặn multiple calls

    const words = sentence.trim().split(/\s+/);
    const expectedItems = calculateExpectedItems(words, currentStep);

    if (currentItemIndex < expectedItems.length) {
      setIsProcessing(true); // Bắt đầu processing

      const expectedItem = expectedItems[currentItemIndex];
      setCompletedItems((prev) => [...prev, expectedItem]);
      setCurrentItemInput("");
      setItemFeedback(`⏭️ Đã skip: "${expectedItem}"`);

      if (currentItemIndex + 1 >= expectedItems.length) {
        setTimeout(() => {
          // Lưu vào history
          const stepData = {
            step: currentStep,
            word: currentStep > 0 ? words[currentStep - 1] : "Start",
            items: [...completedItems, expectedItem],
            completed: true,
          };

          setStepHistory((prev) => {
            const newHistory = [...prev];
            const existingIndex = newHistory.findIndex(
              (h) => h.step === currentStep
            );
            if (existingIndex >= 0) {
              newHistory[existingIndex] = stepData;
            } else {
              newHistory.push(stepData);
            }
            return newHistory;
          });

          if (currentStep < words.length) {
            setCurrentStep(currentStep + 1);
            setCurrentItemIndex(0);
            setCompletedItems([]);
            setItemFeedback("");
          } else {
            setParsingComplete(true);
          }
          setIsProcessing(false); // Kết thúc processing
        }, 1000);
      } else {
        setTimeout(() => {
          setCurrentItemIndex(currentItemIndex + 1);
          setItemFeedback("");
          setIsProcessing(false); // Kết thúc processing
        }, 1000);
      }
    }
  };

  const getHint = () => {
    const words = sentence.trim().split(/\s+/);
    const expectedItems = calculateExpectedItems(words, currentStep);

    if (currentStep === 0) {
      return "Hint: Bắt đầu với các production rules có thể từ S (start symbol)";
    }

    const currentWord = words[currentStep - 1];
    const pos = dictionary[currentWord.toLowerCase()] || [];

    return `Hint: Từ "${currentWord}" có thể là: ${pos.join(
      ", "
    )}. Áp dụng Scan, Predict và Complete operations.`;
  };

  const resetParsing = () => {
    setCurrentStep(0);
    setUserItems("");
    setFeedback("");
    setIsCorrect(null);
    setShowHint(false);
    setParsingComplete(false);
    setCurrentItemIndex(0);
    setCurrentItemInput("");
    setCompletedItems([]);
    setItemFeedback("");
    setStepHistory([]);
    setExpandedSteps({});
    setIsProcessing(false);
  };

  const truncateText = (text, maxLength = 10) => {
    return text?.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  const toggleStepExpansion = (stepNum) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepNum]: !prev[stepNum],
    }));
  };

  const words = sentence.trim().split(/\s+/);
  const currentWord = currentStep > 0 ? words[currentStep - 1] : "";
  const expectedItems = sentence
    ? calculateExpectedItems(words, currentStep)
    : [];
  const currentExpectedItem = expectedItems[currentItemIndex] || "";
  const totalItemsInStep = expectedItems.length;

  return (
    <div className="flex bg-gray-100 h-full">
      {/* Sidebar - Lịch sử các bước */}
      <div className="h-screen w-80 bg-white shadow-lg overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <History size={20} />
            Lịch sử các bước
          </h2>
        </div>

        <div className="p-4 mt-14 flex-1 overflow-y-auto fixed">
          {stepHistory.length === 0 ? (
            <p className="text-gray-500 text-sm"></p>
          ) : (
            <div className="space-y-3">
              {stepHistory.map((step, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg">
                  <div
                    className="p-3 bg-green-50 border-l-4 border-l-green-500 cursor-pointer hover:bg-green-100 transition-colors"
                    onClick={() => toggleStepExpansion(step.step)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="font-medium text-green-800">
                          I{step.step}
                        </span>
                        {step.word !== "Start" && (
                          <span className="text-sm text-green-600">
                            ("{step.word}")
                          </span>
                        )}
                      </div>
                      {expandedSteps[step.step] ? (
                        <ChevronDown size={16} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {expandedSteps[step.step] && (
                    <div className="p-3 bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Items ({step.items.length}):
                      </h4>
                      <div className="space-y-1">
                        {step.items.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="text-xs font-mono text-gray-600 bg-white p-1 rounded"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Bước hiện tại */}
          {sentence && !parsingComplete && (
            <div className="mb-4 border border-blue-200 rounded-lg">
              <div className="p-3 bg-blue-50 border-l-4 border-l-blue-500">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-blue-800">
                    I{currentStep} (Đang thực hiện)
                  </span>
                  {currentWord && (
                    <span className="text-sm text-blue-600">
                      ("{currentWord}")
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Đã hoàn thành ({completedItems.length}/{totalItemsInStep}):
                </h4>
                <div className="space-y-1">
                  {completedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-mono text-gray-600 bg-white p-1 rounded"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                {currentExpectedItem && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Tiếp theo:</div>
                    <div className="text-xs font-mono text-blue-600 bg-blue-50 p-1 rounded">
                      {truncateText(currentExpectedItem)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h1 className="text-2xl font-bold text-blue-900 mb-2">
              Earley Parser Interactive
            </h1>
            <p className="text-blue-700">
              Thực hành thuật toán Earley parsing với kiểm tra tự động
            </p>
          </div>

          {/* Dictionary và Grammar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">
                📚 Dictionary
              </h3>
              <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                {Object.entries(dictionary).map(([word, pos]) => (
                  <div key={word} className="flex">
                    <span className="font-mono w-16">{word}:</span>
                    <span className="text-blue-600">{pos.join(", ")}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">
                📋 Grammar Rules
              </h3>
              <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                {grammar.map((rule, idx) => (
                  <div key={idx} className="font-mono text-green-700">
                    {rule}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Input Section */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              🎯 Chọn câu để phân tích
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {sampleSentences.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSentence(sample);
                    resetParsing();
                  }}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm"
                >
                  {sample}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
                placeholder="Hoặc nhập câu khác..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={resetParsing}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
              >
                <Play size={16} />
                Bắt đầu
              </button>
            </div>
          </div>

          {/* Parsing Section */}
          {sentence && (
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">
                  📊 Bước {currentStep}: I{currentStep}
                  {currentWord && ` (Từ: "${currentWord}")`}
                </h3>
                <button
                  onClick={resetParsing}
                  className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-1"
                >
                  <RefreshCw size={14} />
                  Reset
                </button>
              </div>

              {/* Progress */}
              <div className="flex items-center mb-4">
                {words.map((word, idx) => (
                  <div key={idx} className="flex items-center">
                    <div
                      className={`px-2 py-1 rounded text-sm ${
                        idx < currentStep
                          ? "bg-green-100 text-green-800"
                          : idx === currentStep
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {word}
                    </div>
                    {idx < words.length - 1 && (
                      <div className="mx-2 text-gray-400">→</div>
                    )}
                  </div>
                ))}
              </div>

              {!parsingComplete && (
                <div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Item {currentItemIndex + 1}/{totalItemsInStep}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowHint(!showHint)}
                          className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                        >
                          💡 Gợi ý
                        </button>
                        <button
                          onClick={skipCurrentItem}
                          disabled={isProcessing} // Disable khi đang processing
                          className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs disabled:opacity-50"
                        >
                          ⏭️ Skip
                        </button>
                      </div>
                    </div>
                  </div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nhập item tiếp theo:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentItemInput}
                      onChange={(e) => setCurrentItemInput(e.target.value)}
                      placeholder="Ví dụ: S -> .NP VP, 0 (hoặc S → .NP VP, 0)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      onKeyPress={(e) =>
                        e.key === "Enter" && checkCurrentItem()
                      }
                    />
                    <button
                      onClick={checkCurrentItem}
                      disabled={!currentItemInput.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Kiểm tra
                    </button>
                  </div>
                </div>
              )}

              {/* Item Feedback */}
              {itemFeedback && (
                <div
                  className={`mt-4 p-3 rounded ${
                    itemFeedback.includes("✅")
                      ? "bg-green-100 text-green-800"
                      : itemFeedback.includes("❌")
                      ? "bg-red-100 text-red-800"
                      : itemFeedback.includes("⏭️")
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {itemFeedback}
                </div>
              )}

              {/* General Feedback */}
              {feedback && (
                <div
                  className={`mt-4 p-3 rounded ${
                    isCorrect
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {feedback}
                </div>
              )}

              {/* Hint */}
              {showHint && (
                <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded">
                  <div className="mb-2">
                    <strong>💡 Gợi ý chung:</strong> {getHint()}
                  </div>
                  {currentExpectedItem && (
                    <div className="text-sm">
                      <strong>🎯 Item hiện tại:</strong>
                      <span className="font-mono bg-yellow-200 px-1 rounded ml-1">
                        {currentExpectedItem}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📖 Hướng dẫn</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                • <strong>Prediction:</strong> Thêm items mới khi gặp
                non-terminal sau dấu chấm
              </p>
              <p>
                • <strong>Scanning:</strong> Di chuyển dấu chấm qua terminal khi
                khớp với input
              </p>
              <p>
                • <strong>Completion:</strong> Hoàn thành rule và cập nhật items
                trước đó
              </p>
              <p>
                • <strong>Format linh hoạt:</strong> Có thể dùng "-{">"}" hoặc
                "→", khoảng cách tùy ý
              </p>
              <p>
                • <strong>Ví dụ hợp lệ:</strong> "S → .NP VP, 0" hoặc "S -{">"}{" "}
                .NP VP , 0"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarleyParserInterface;
