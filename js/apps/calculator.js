/* ==========================================================================
   KryptonOS Application - Desktop Calculator
   ========================================================================== */

import { wm } from '../wm.js';
import { sound } from '../sound.js';

export function openCalculator() {
    const content = document.createElement('div');
    content.className = 'calc-app';

    content.innerHTML = `
        <div class="calc-display" id="c-disp">0</div>
        <div class="calc-grid">
            <button class="calc-btn op" data-val="C">C</button>
            <button class="calc-btn op" data-val="(">(</button>
            <button class="calc-btn op" data-val=")">)</button>
            <button class="calc-btn op" data-val="/">/</button>
            
            <button class="calc-btn" data-val="7">7</button>
            <button class="calc-btn" data-val="8">8</button>
            <button class="calc-btn" data-val="9">9</button>
            <button class="calc-btn op" data-val="*">*</button>

            <button class="calc-btn" data-val="4">4</button>
            <button class="calc-btn" data-val="5">5</button>
            <button class="calc-btn" data-val="6">6</button>
            <button class="calc-btn op" data-val="-">-</button>

            <button class="calc-btn" data-val="1">1</button>
            <button class="calc-btn" data-val="2">2</button>
            <button class="calc-btn" data-val="3">3</button>
            <button class="calc-btn op" data-val="+">+</button>

            <button class="calc-btn" data-val="0" style="grid-column: span 2;">0</button>
            <button class="calc-btn" data-val=".">.</button>
            <button class="calc-btn op" data-val="=" style="background: var(--accent-primary); color: #000;">=</button>
        </div>
    `;

    const disp = content.querySelector('#c-disp');
    let expr = '';

    content.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            sound.playClick();
            const val = btn.getAttribute('data-val');

            if (val === 'C') {
                expr = '';
                disp.textContent = '0';
            } else if (val === '=') {
                try {
                    // Safe basic arithmetic evaluation
                    if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
                        disp.textContent = 'ERROR';
                        return;
                    }
                    const result = Function(`"use strict"; return (${expr})`)();
                    disp.textContent = result;
                    expr = String(result);
                } catch (e) {
                    disp.textContent = 'ERROR';
                }
            } else {
                expr += val;
                disp.textContent = expr;
            }
        });
    });

    wm.createWindow({
        id: 'calculator',
        title: 'Calculator - KryptonOS',
        icon: '🧮',
        width: 320,
        height: 420,
        content: content
    });
}
