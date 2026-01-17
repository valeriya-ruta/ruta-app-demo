"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Play } from "lucide-react";

interface ContentCardProps {
  title: string;
  subtitle?: string;
  description: string;
  author: {
    name: string;
    avatar?: string;
    handle: string;
  };
  stats: {
    likes: number;
    comments: number;
    shares?: number;
  };
  media?: {
    type: "image" | "gradient";
    src?: string;
    gradient?: string;
  };
  tags?: string[];
  index: number;
}

export default function ContentCard({
  title,
  subtitle,
  description,
  author,
  stats,
  media,
  tags,
  index,
}: ContentCardProps) {
  // Color schemes for variety - more sophisticated gradients
  const colorSchemes = [
    { 
      bg: "linear-gradient(145deg, #667eea 0%, #764ba2 50%, #f093fb 100%)", 
      accent: "violet",
      iconBg: "from-violet-400 to-fuchsia-500"
    },
    { 
      bg: "linear-gradient(145deg, #11998e 0%, #38ef7d 50%, #a8edea 100%)", 
      accent: "emerald",
      iconBg: "from-emerald-400 to-teal-500"
    },
    { 
      bg: "linear-gradient(145deg, #f093fb 0%, #f5576c 50%, #ff9a9e 100%)", 
      accent: "rose",
      iconBg: "from-rose-400 to-pink-500"
    },
    { 
      bg: "linear-gradient(145deg, #4facfe 0%, #00f2fe 50%, #a8edea 100%)", 
      accent: "sky",
      iconBg: "from-sky-400 to-cyan-500"
    },
    { 
      bg: "linear-gradient(145deg, #fa709a 0%, #fee140 50%, #ffecd2 100%)", 
      accent: "amber",
      iconBg: "from-amber-400 to-orange-500"
    },
  ];

  const scheme = colorSchemes[index % colorSchemes.length];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden relative">
      {/* Colored top bar - visible in peek state */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 z-30"
        style={{
          background: media?.gradient || scheme.bg,
        }}
      />
      
      {/* Media/Header section - prominent visual area */}
      <div 
        className="relative h-[38%] min-h-[200px]"
        style={{
          background: media?.gradient || scheme.bg,
        }}
      >
        {media?.type === "image" && media.src && (
          <img
            src={media.src}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        {/* Animated gradient orbs for visual interest */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute w-64 h-64 rounded-full blur-3xl opacity-30"
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)",
              top: "-20%",
              right: "-10%",
            }}
          />
          <div 
            className="absolute w-48 h-48 rounded-full blur-3xl opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)",
              bottom: "10%",
              left: "-5%",
            }}
          />
        </div>
        
        {/* Gradient overlay for text readability */}
        <div 
          className="absolute inset-0" 
          style={{
            background: "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.6) 40%, transparent 70%)",
          }}
        />
        
        {/* Top actions - subtle */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <button className="p-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25 transition-all duration-200 shadow-lg">
            <MoreHorizontal className="w-5 h-5 text-white/90" />
          </button>
        </div>
        
        {/* Play button for video content feel */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <button className="p-5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all duration-200 shadow-xl group">
            <Play className="w-8 h-8 text-white fill-white/80 group-hover:fill-white transition-colors" />
          </button>
        </div>

        {/* Author info at bottom of media section */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${scheme.iconBg} flex items-center justify-center text-white font-bold text-sm shadow-xl ring-2 ring-white/30`}>
              {author.avatar ? (
                <img src={author.avatar} alt={author.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                author.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate text-base">{author.name}</p>
              <p className="text-sm text-muted-foreground truncate">@{author.handle}</p>
            </div>
            <button className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-full hover:bg-primary/90 transition-colors shadow-lg">
              Follow
            </button>
          </div>
        </div>
      </div>

      {/* Content section */}
      <div className="flex-1 flex flex-col px-5 py-5 overflow-hidden">
        {/* Title area */}
        <div className="mb-4">
          {subtitle && (
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
              {subtitle}
            </p>
          )}
          <h2 className="text-2xl font-bold text-foreground leading-tight line-clamp-2 tracking-tight">
            {title}
          </h2>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-[15px] leading-relaxed line-clamp-4 mb-5">
          {description}
        </p>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {tags.slice(0, 4).map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1.5 text-xs font-medium bg-secondary/80 text-secondary-foreground rounded-full hover:bg-secondary transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Engagement stats - clean horizontal layout */}
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <div className="flex items-center gap-6">
            <ActionButton icon={Heart} count={formatNumber(stats.likes)} label="Like" />
            <ActionButton icon={MessageCircle} count={formatNumber(stats.comments)} label="Comment" />
            <ActionButton icon={Share2} count={stats.shares ? formatNumber(stats.shares) : undefined} label="Share" />
          </div>
          <button className="p-2.5 -mr-2 rounded-full hover:bg-secondary transition-colors group">
            <Bookmark className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: typeof Heart;
  count?: string;
  label: string;
}

function ActionButton({ icon: Icon, count, label }: ActionButtonProps) {
  return (
    <button 
      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
      aria-label={label}
    >
      <Icon className="w-[22px] h-[22px] group-hover:scale-110 transition-transform" />
      {count && <span className="text-sm font-semibold tabular-nums">{count}</span>}
    </button>
  );
}
