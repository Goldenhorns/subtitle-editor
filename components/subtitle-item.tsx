// SubtitleItem.tsx
import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { isValidTime, timeToSeconds } from "@/lib/utils";
import { useSubtitleContext } from "@/context/subtitle-context";
import type { Subtitle } from "@/types/subtitle";
import {
  IconTrash,
  IconWand,
  IconLanguage,
  IconFold,
  IconPlus,
} from "@tabler/icons-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  subtitle: Subtitle;
  nextSubtitle: Subtitle | null;
  isLastItem: boolean;
  currentTime: number;
  editingSubtitleUuid: string | null;
  onScrollToRegion: (uuid: string) => void;
  setIsPlaying: (p: boolean) => void;
  setPlaybackTime: (t: number) => void;
  setEditingSubtitleUuid: (id: string | null) => void;
}

export default function SubtitleItem({
  subtitle,
  nextSubtitle,
  isLastItem,
  currentTime,
  editingSubtitleUuid,
  onScrollToRegion,
  setIsPlaying,
  setPlaybackTime,
  setEditingSubtitleUuid,
}: Props) {
  const {
    updateSubtitleStartTimeAction,
    updateSubtitleEndTimeAction,
    updateSubtitleTextAction,
    mergeSubtitlesAction,
    addSubtitleAction,
    deleteSubtitleAction,
    splitSubtitleAction,
  } = useSubtitleContext();

  const { toast } = useToast();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  /* ---------- 时间编辑 ---------- */
  const [editingStart, setEditingStart] = useState(false);
  const [editingEnd, setEditingEnd] = useState(false);
  const [draftStart, setDraftStart] = useState(subtitle.startTime);
  const [draftEnd, setDraftEnd] = useState(subtitle.endTime);

  /* ---------- 文本编辑 ---------- */
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");

  useEffect(() => {
    const [o = "", t = ""] = (subtitle.text || "").split("\n");
    setOriginalText(o);
    setTranslatedText(t);
  }, [subtitle.text]);

  const commit = () => {
    const full = `${originalText}\n${translatedText}`.trim();
    if (full !== subtitle.text)
      updateSubtitleTextAction(subtitle.id, full);
  };

  const handleTime =
    (isStart: boolean) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter" && e.key !== "Escape") return;
      e.preventDefault();
      const val = isStart ? draftStart : draftEnd;
      if (e.key === "Escape") {
        isStart ? setEditingStart(false) : setEditingEnd(false);
        return;
      }
      if (!isValidTime(val)) {
        toast({
          title: "Invalid time",
          description: "Use HH:MM:SS,MS",
          className: "bg-orange-100 text-red-600",
        });
        isStart ? setEditingStart(false) : setEditingEnd(false);
        return;
      }
      const sec = timeToSeconds(val);
      if (isStart) {
        if (sec > timeToSeconds(subtitle.endTime)) {
          toast({ title: "Start > End", className: "bg-orange-100 text-red-600" });
          setEditingStart(false);
          return;
        }
        updateSubtitleStartTimeAction(subtitle.id, val);
        setEditingStart(false);
      } else {
        if (sec < timeToSeconds(subtitle.startTime)) {
          toast({ title: "End < Start", className: "bg-orange-100 text-red-600" });
          setEditingEnd(false);
          return;
        }
        updateSubtitleEndTimeAction(subtitle.id, val);
        setEditingEnd(false);
      }
    };

  /* ---------- 生成 / 翻译占位 ---------- */
  const handleGenerate = () => toast({ title: "开始生成字幕…" });
  const handleTranslate = () => toast({ title: "开始翻译字幕…" });

  /* ---------- 添加按钮禁用判断 ---------- */
  let addDisabled = false;
  let addTip = "Add";
  if (!isLastItem && nextSubtitle) {
    const gap =
      timeToSeconds(nextSubtitle.startTime) -
      timeToSeconds(subtitle.endTime);
    addDisabled = gap <= 0.001;
    if (addDisabled) addTip = "No room to add";
  }

  /* ---------- UI ---------- */
  return (
    <motion.div
      key={subtitle.uuid}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.15 }}
    >
      <TooltipProvider>
        <div
          id={`subtitle-${subtitle.uuid}`}
          className={`relative rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow
            p-3 mb-3
            ${
              timeToSeconds(subtitle.startTime) <= currentTime &&
              timeToSeconds(subtitle.endTime) > currentTime
                ? "ring-2 ring-cyan-400"
                : ""
            }`}
          onClick={() => setPlaybackTime(timeToSeconds(subtitle.startTime))}
        >
          {/* 删除按钮（右上角） */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 text-gray-400 hover:text-red-600"
            onClick={() => deleteSubtitleAction(subtitle.id)}
          >
            <IconTrash size={16} />
          </Button>

          {/* 顶层：ID + 时间码 */}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span className="font-mono">#{subtitle.id}</span>
            {/* 开始时间 */}
            {editingStart ? (
              <Input
                autoFocus
                className="w-24 h-6 text-xs"
                value={draftStart}
                onChange={(e) => setDraftStart(e.target.value)}
                onBlur={() => setEditingStart(false)}
                onKeyDown={handleTime(true)}
              />
            ) : (
              <button
                className="hover:bg-gray-100 px-1 rounded"
                onClick={() => {
                  setEditingStart(true);
                  setDraftStart(subtitle.startTime);
                }}
              >
                {subtitle.startTime}
              </button>
            )}
            <span>→</span>
            {/* 结束时间 */}
            {editingEnd ? (
              <Input
                autoFocus
                className="w-24 h-6 text-xs"
                value={draftEnd}
                onChange={(e) => setDraftEnd(e.target.value)}
                onBlur={() => setEditingEnd(false)}
                onKeyDown={handleTime(false)}
              />
            ) : (
              <button
                className="hover:bg-gray-100 px-1 rounded"
                onClick={() => {
                  setEditingEnd(true);
                  setDraftEnd(subtitle.endTime);
                }}
              >
                {subtitle.endTime}
              </button>
            )}
          </div>

          {/* 原文行 */}
          <div className="flex items-start space-x-2 mt-2">
            <div className="flex-1">
              <span className="text-xs text-gray-400">原文</span>
              {editingSubtitleUuid === subtitle.uuid ? (
                <Textarea
                  ref={textAreaRef}
                  className="w-full min-h-8 text-sm resize-none"
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  onBlur={() => {
                    commit();
                    setEditingSubtitleUuid(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      commit();
                      setEditingSubtitleUuid(null);
                    } else if (e.key === "Escape") {
                      setEditingSubtitleUuid(null);
                    }
                  }}
                />
              ) : (
                <button
                  className="w-full text-left text-sm bg-gray-50 px-2 py-1 rounded"
                  onClick={() => setEditingSubtitleUuid(subtitle.uuid)}
                >
                  {originalText || (
                    <span className="text-gray-400">(空)</span>
                  )}
                </button>
              )}
            </div>
            <Button
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleGenerate}
            >
              <IconWand size={14} className="mr-1" />
              生成
            </Button>
          </div>

          {/* 译文行 */}
          <div className="flex items-start space-x-2 mt-2">
            <div className="flex-1">
              <span className="text-xs text-gray-400">译文</span>
              {editingSubtitleUuid === subtitle.uuid ? (
                <Textarea
                  className="w-full min-h-8 text-sm resize-none"
                  value={translatedText}
                  onChange={(e) => setTranslatedText(e.target.value)}
                  onBlur={() => {
                    commit();
                    setEditingSubtitleUuid(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      commit();
                      setEditingSubtitleUuid(null);
                    } else if (e.key === "Escape") {
                      setEditingSubtitleUuid(null);
                    } else if (e.key === "Enter" && e.shiftKey) {
                      e.preventDefault();
                      const pos = e.currentTarget.selectionStart;
                      const len = e.currentTarget.value.length;
                      splitSubtitleAction(subtitle.id, pos, len);
                      setEditingSubtitleUuid(null);
                    }
                  }}
                />
              ) : (
                <button
                  className="w-full text-left text-sm bg-gray-50 px-2 py-1 rounded"
                  onClick={() => setEditingSubtitleUuid(subtitle.uuid)}
                >
                  {translatedText || (
                    <span className="text-gray-400">(空)</span>
                  )}
                </button>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={handleTranslate}
            >
              <IconLanguage size={14} className="mr-1" />
              翻译
            </Button>
          </div>

          {/* 底部合并 / 新增 */}
          <div className="flex justify-center items-center gap-8 mt-3 -mb-1">
            {!isLastItem && nextSubtitle && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() =>
                      mergeSubtitlesAction(subtitle.id, nextSubtitle.id)
                    }
                  >
                    <IconFold size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Merge</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-6 px-2 text-xs
                    ${
                      addDisabled
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-green-600"
                    }`}
                  onClick={() => {
                    if (!addDisabled)
                      addSubtitleAction(
                        subtitle.id,
                        !isLastItem && nextSubtitle
                          ? nextSubtitle.id
                          : null
                      );
                  }}
                  disabled={addDisabled}
                >
                  <IconPlus size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{addTip}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    </motion.div>
  );
}