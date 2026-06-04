/**
 * CardErrorBoundary.jsx — inline guard around a single JourneyPlanCard.
 *
 * The card's panels already self-guard, but if anything unexpected slips past a
 * guard at render time we degrade to a small inline note instead of blanking the
 * whole chat. The full assistant narrative still renders below, so no info is lost.
 */

import { Component } from "react";

export default class CardErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[MedBridge] JourneyPlanCard render error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <p className="text-[13px] text-[var(--color-text-secondary)] italic mb-2">
        Couldn't display the structured plan — see the summary below.
      </p>
    );
  }
}
