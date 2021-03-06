import React from 'react';

import Analyzer from 'Parser/Core/Analyzer';
import Combatants from 'Parser/Core/Modules/Combatants';

import SPELLS from 'common/SPELLS';
import StatisticBox, { STATISTIC_ORDER } from 'Main/StatisticBox';
import SpellIcon from "common/SpellIcon";
import { formatPercentage } from "common/format";
import SpellLink from "common/SpellLink";
import SPECS from 'common/SPECS';

//generally accepted rule is to save crows if boss is below 25% health.
const CROWS_SAVE_PERCENT = 0.25;
//when we enter execute and Bullseye starts racking up
const EXECUTE_PERCENT = 0.2;

class AMurderOfCrows extends Analyzer {

  static dependencies = {
    combatants: Combatants,
  };

  bossIDs = [];
  damage = 0;
  shouldHaveSaved = 0;
  bossHP = 0;
  goodCrowsCasts = 0;
  totalCrowsCasts = 0;

  on_initialized() {
    this.active = this.combatants.selected.hasTalent(SPELLS.A_MURDER_OF_CROWS_TALENT_SHARED.id) && SPECS.MARKSMANSHIP_HUNTER;
    this.owner.report.enemies.forEach(enemy => {
      enemy.fights.forEach(fight => {
        if (fight.id === this.owner.fight.id && enemy.type === "Boss") this.bossIDs.push(enemy.id);
      });
    });
  }

  on_byPlayer_damage(event) {
    const spellId = event.ability.guid;
    if (spellId !== SPELLS.A_MURDER_OF_CROWS_SPELL.id) {
      return;
    }
    this.damage += event.amount;
  }

  on_byPlayer_cast(event) {
    const spellId = event.ability.guid;
    if (spellId !== SPELLS.A_MURDER_OF_CROWS_TALENT_SHARED.id) {
      return;
    }
    this.totalCrowsCasts += 1;
    if (event.maxHitPoints && this.bossIDs.includes(event.targetID)) {
      if ((event.hitPoints / event.maxHitPoints) <= CROWS_SAVE_PERCENT && (event.hitPoints / event.maxHitPoints) > EXECUTE_PERCENT) {
        this.shouldHaveSaved += 1;
        this.bossHP = (event.hitPoints / event.maxHitPoints);
        return;
      }
    }
    this.goodCrowsCasts += 1;
  }

  statistic() {
    let tooltipText = `You cast A Murder of Crows a total of ${this.totalCrowsCasts} times.`;
    tooltipText += this.shouldHaveSaved > 0 ? `<ul><li>You had ${this.shouldHaveSaved} casts of A Murder of Crows where you should have delayed casting it.<ul><li>This occurs when you cast A Murder of Crows when the boss has between 25% and 20% health, which should generally be avoided so as to enable you to cast A Murder of Crows the moment the boss hits 20% to gain Bullseye stacks as fast as possible.</li></ul></li></ul>` : ``;

    return (
      <StatisticBox
        icon={<SpellIcon id={SPELLS.A_MURDER_OF_CROWS_TALENT_SHARED.id} />}
        value={(
          <span>
            {this.goodCrowsCasts}{'  '}
            <SpellIcon
              id={SPELLS.A_MURDER_OF_CROWS_TALENT_SHARED.id}
              style={{
                height: '1.3em',
                marginTop: '-.1em',
              }}
            />
            {'  '}
            {this.shouldHaveSaved}{'  '}
            <SpellIcon
              id={SPELLS.A_MURDER_OF_CROWS_TALENT_SHARED.id}
              style={{
                height: '1.3em',
                marginTop: '-.1em',
                filter: 'grayscale(100%)',
              }}
            />
          </span>

        )}
        label={`A Murder of Crows`}
        tooltip={tooltipText}
      />
    );
  }
  subStatistic() {
    return (
      <div className="flex">
        <div className="flex-main">
          <SpellLink id={SPELLS.A_MURDER_OF_CROWS_TALENT_SHARED.id}>
            <SpellIcon id={SPELLS.A_MURDER_OF_CROWS_TALENT_SHARED.id} noLink /> A Murder of Crows
          </SpellLink>
        </div>
        <div className="flex-sub text-right">
          {(this.owner.formatItemDamageDone(this.damage))}
        </div>
      </div>
    );
  }
  suggestions(when) {
    when(this.shouldHaveSaved).isGreaterThan(0)
      .addSuggestion((suggest, actual, recommended) => {
        return suggest(<span>You should <b>generally</b> save <SpellLink id={SPELLS.A_MURDER_OF_CROWS_TALENT_SHARED.id} /> when the boss has under 25% hp so that it is ready to use when the boss hits 20% and you can start getting <SpellLink id={SPELLS.BULLSEYE_BUFF.id} /> quicker.</span>)
          .icon(SPELLS.A_MURDER_OF_CROWS_TALENT_SHARED.icon)
          .actual(`You cast crows while boss ${formatPercentage(this.bossHP)}% HP.`)
          .recommended(`0 casts when boss has between 20 and 25% hp is recommended`)
          .regular(recommended);
      });
  }
  statisticOrder = STATISTIC_ORDER.CORE(12);
}

export default AMurderOfCrows;
