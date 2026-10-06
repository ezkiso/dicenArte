"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  children: CategoryNode[];
}

function CategoryBranch({
  category,
  mobile,
  onNavigate,
  depth,
}: {
  category: CategoryNode;
  mobile: boolean;
  onNavigate?: () => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = category.children.length > 0;
  const childrenId = `category-children-${category.id}`;
  const linkStyle = mobile
    ? "py-2.5 text-sm"
    : depth === 0
      ? "py-2 text-sm font-semibold"
      : "py-1.5 text-sm";

  return (
    <li className="min-w-0">
      <div className="flex items-center gap-2">
        <Link
          href={`/tienda?categoria=${category.slug}`}
          onClick={onNavigate}
          className={`min-w-0 flex-1 text-base-gray-700 transition-colors hover:text-base-black ${linkStyle}`}
        >
          {category.name}
        </Link>
        {hasChildren && (
          <button
            type="button"
            aria-label={`${expanded ? "Contraer" : "Expandir"} ${category.name}`}
            aria-expanded={expanded}
            aria-controls={childrenId}
            onClick={() => setExpanded((isExpanded) => !isExpanded)}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-base-gray-500 transition-colors hover:text-base-black focus-visible:outline"
          >
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>
      {hasChildren && expanded && (
        <ul id={childrenId} className="ml-3 border-l border-base-gray-200 pl-3">
          {category.children.map((child) => (
            <CategoryBranch
              key={child.id}
              category={child}
              mobile={mobile}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CategoryTreeMenu({
  categories,
  mobile = false,
  onNavigate,
}: {
  categories: CategoryNode[];
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <ul className={mobile ? "divide-y divide-base-gray-200" : "space-y-1"}>
      {categories.map((category) => (
        <CategoryBranch
          key={category.id}
          category={category}
          mobile={mobile}
          onNavigate={onNavigate}
          depth={0}
        />
      ))}
    </ul>
  );
}