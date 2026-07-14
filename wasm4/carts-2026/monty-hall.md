---
author: Vitor Teodoro Correa
date: 2026-07-06
---

# Monty Hall

> *"Should I switch or stay? Does it even matter?"*
> It does. And the numbers will prove it.

---

## What Is This?

This is a playable implementation of the **Monty Hall Problem** — one of the most famous and counterintuitive puzzles in probability theory — built for the [WASM-4](https://wasm4.org/) fantasy console.

Walk your character into one of three doors, watch the host reveal a goat, then decide: **switch** or **stay**. The game tracks your statistics across every round so you can watch the math unfold in real time.

---

## How to Play

1. **Move** your character with the **arrow keys**.
2. **Walk into a door** to make your initial pick. The host will immediately open one of the other doors, always revealing a goat.
3. You now face a choice:
   - Press **Z** → **Switch** to the remaining unopened door.
   - Press **X** → **Stay** with your original pick.
4. All three doors open. Either a **$** (prize) or a goat is behind your final choice.
5. The round resets automatically after ~2.5 seconds.

### Stats panel (top of screen)

| Label | Meaning |
|-------|---------|
| `Wins` | Total rounds won |
| `Rnd`  | Total rounds played |
| `Sw`   | Times you chose to Switch |
| `St`   | Times you chose to Stay |

---

## The Monty Hall Problem

The puzzle originates from the American TV game show *Let's Make a Deal*, hosted by **Monty Hall**. It was formally posed as a probability puzzle by **Marilyn vos Savant** in her *Parade* magazine column in 1990 — and the response it generated was legendary.

**The setup:**
- There are **3 doors**. Behind one is a **prize**. Behind the other two are **goats**.
- You pick a door.
- The host — who *always knows* where the prize is — opens one of the other doors, **always revealing a goat**.
- You are offered the chance to switch to the remaining closed door.

**The question:** Should you switch, stay, or does it not matter?

**Most people's intuition:** *"There are now 2 doors left, so it's 50/50. It doesn't matter."*

**The math:** You should **always switch**. Switching wins **2 out of 3 times**.

---

## The Mathematics

### Initial Probability

When you first pick a door, the probability that the prize is behind it is:

```
P(prize behind your door)            = 1/3
P(prize behind one of the other two) = 2/3
```

### What the Host Reveals

The host's action is **not random**. He is constrained to always open a door that:
1. You did **not** pick.
2. Does **not** hide the prize.

This constraint is the entire key to the puzzle. The host's reveal carries **information**.

When the host opens a goat door, the `2/3` probability that was spread across the two unchosen doors does **not** disappear — it **collapses entirely onto the one remaining closed door**.

```
After the host reveals a goat:

  Your door:       P(win if you stay)   = 1/3
  Remaining door:  P(win if you switch) = 2/3
```

### Formal Proof via Bayes' Theorem

Let:
- `C` = your initial choice (say, Door 1)
- `P` = the door hiding the prize
- `H` = the door the host opens (say, Door 3)

We want `P(Prize at Door 2 | Host opened Door 3)`.

Using Bayes' Theorem:

```
P(P=2 | H=3) =  P(H=3 | P=2) x P(P=2)
                ───────────────────────
                        P(H=3)
```

Computing each term:
- `P(P=2) = 1/3` — uniform prior, prize equally likely behind any door
- `P(H=3 | P=2) = 1` — if prize is at Door 2, host **must** open Door 3 (only valid choice)
- `P(H=3 | P=1) = 1/2` — if prize is at Door 1 (your door), host can open Door 2 or 3 freely
- `P(H=3 | P=3) = 0` — host never reveals the prize

Normalising constant:

```
P(H=3) = P(H=3|P=1)*P(P=1) + P(H=3|P=2)*P(P=2) + P(H=3|P=3)*P(P=3)
       = (1/2)(1/3) + (1)(1/3) + (0)(1/3)
       = 1/6 + 2/6 = 1/2
```

Therefore:

```
P(P=2 | H=3) = (1 x 1/3) / (1/2) = 2/3   <- Switch wins
P(P=1 | H=3) = (1/2 x 1/3) / (1/2) = 1/3  <- Stay wins
```

The math is unambiguous. **Switching wins with probability 2/3.**

---

## Long-Term Behaviour and the Normal Distribution

This is where it gets beautiful. Play enough rounds and something remarkable happens: the abstract probabilities crystallise into a shape you can see.

### Each Round Is a Bernoulli Trial

Each round is a **Bernoulli trial** — a binary outcome (win or lose) with a fixed probability `p`.  
If you always switch, `p = 2/3`. If you always stay, `p = 1/3`.

### Law of Large Numbers

As the number of rounds `n` grows, your observed win rate converges to the true probability:

```
Wins / n  -->  p   as n -> infinity
```

Play 10 rounds and noise dominates. Play 1,000 rounds and your win rate will sit very close to 2/3 (switching) or 1/3 (staying). The randomness averages out.

### Central Limit Theorem

More precisely, the **total number of wins** `W` after `n` rounds follows an approximately **Normal distribution**:

```
W ~ N(mu, sigma^2)

  where:
    mu    = n*p          (expected number of wins)
    sigma^2 = n*p*(1-p)  (variance)
    sigma   = sqrt(n*p*(1-p))  (standard deviation)
```

For **always switching** (p = 2/3) over n rounds:

```
mu_switch    = 2n/3
sigma_switch = sqrt(n * 2/3 * 1/3) = sqrt(2n/9)
```

For **always staying** (p = 1/3) over n rounds:

```
mu_stay    = n/3
sigma_stay = sqrt(n * 1/3 * 2/3) = sqrt(2n/9)
```

Both strategies produce bell curves with **equal variance**, but centred at completely different means — `n/3` vs `2n/3`. Their separation grows with `n`, while their width only grows with `sqrt(n)`.

```
Visualised over n rounds:

        Stay                         Switch
          |                            |
    /-----\                      /-----\
   /       \                    /       \
--/-------- \------------------/-------- \--
  0        n/3                2n/3        n

         <-------- n/3 gap ----------->
```

As `n` grows, the **gap** between the two means (`n/3`) grows **linearly**, while the **spread** (sigma) of each curve grows only as `sqrt(n)`. The curves diverge. After enough rounds they barely overlap at all — making the advantage of switching **statistically undeniable**.

Long-term convergence:

```
Switching:   observed Win% --> 66.7%
Staying:     observed Win% --> 33.3%
```

---

## The Paradox

So why is this called a paradox at all?

When Marilyn vos Savant published her solution in 1990, the backlash was extraordinary. She received **thousands of letters** — including from PhDs and mathematics professors — insisting she was wrong. *"You blew it,"* wrote one. *"There is enough mathematical illiteracy in this country, and we don't need the world's highest IQ propagating more."*

She was right. They were wrong.

The intuitive error is understandable: once one goat door is removed, the human brain **reframes** the situation as a fresh two-door problem. We implicitly assume the host's action was random and uninformative, so we assign equal probability to both remaining doors — arriving at 50/50.

But the host's action is **not** random. He is constrained by knowledge of where the prize is. That constraint is precisely what transfers the entire `2/3` probability from the group of two unchosen doors onto the single remaining closed door.

The paradox, in one sentence:

> **Your intuition says 1/2. The math says 2/3. And if you play this game long enough, the Normal distributions will show you — beyond any reasonable doubt — that the math is right.**

This is the deepest lesson of the Monty Hall Problem: **probability is not always what it feels like**. Our brains evolved for a world of direct cause and effect, not for conditional probability. We ignore information carried by constrained actions. We treat dependent events as independent.

Play this game for a hundred rounds. Track your `Sw` and `St` stats. Watch the win rate climb toward 2/3 every time you switch, and hover near 1/3 every time you stay. The bell curves will do what no argument can — they will make you *feel* the truth of the mathematics.

---

## Controls

| Key | Action |
|-----|--------|
| Arrow keys | Move character |
| **Z** | Switch doors (after host reveals a goat) |
| **X** | Stay with original pick (after host reveals a goat) |

---

## Technical

- **Engine:** [WASM-4](https://wasm4.org/) — a fantasy game console running WebAssembly
- **Language:** C (compiled to WASM with `clang` / `make`)
- **Screen:** 160x160 pixels, 4-colour palette
- **Build:** `make` then `w4 run build/cart.wasm`
