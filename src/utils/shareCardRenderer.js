import { getInitials } from "./helpers";

// Wait for custom fonts to be ready before drawing on canvas
async function waitForFonts() {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
}

// Formatter: "Sábado, 15 Mar 2025"
function getFormattedDate() {
  const date = new Date();
  return date.toLocaleDateString('pt-BR', { 
    weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' 
  });
}

function createBaseCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background gradient (matches BeachCam court-bg vibe)
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#0f172a'); // slate-900
  grad.addColorStop(1, '#020617'); // slate-950
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Subtle court lines pattern in background
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  // Outer box
  ctx.rect(50, 50, width - 100, height - 100);
  // Center line
  ctx.moveTo(50, height / 2);
  ctx.lineTo(width - 50, height / 2);
  ctx.stroke();

  // Watermark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = 'bold 24px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('beachcam.app', width / 2, height - 30);

  // Logo / Title area
  ctx.fillStyle = '#00F5FF'; // neon-blue
  ctx.font = 'italic 900 64px "Montserrat", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BEACHCAM', width / 2, 120);

  ctx.fillStyle = '#8E8E93';
  ctx.font = '600 28px "Outfit", sans-serif';
  ctx.fillText(getFormattedDate().toUpperCase(), width / 2, 170);

  return { canvas, ctx };
}

function drawAvatar(ctx, x, y, radius, name, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0a';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = `bold ${radius * 0.8}px "Outfit", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(getInitials(name), x, y);
}

// ----------------------------------------------------------------------
// EXPORTS
// ----------------------------------------------------------------------

export async function renderRankingCard(players, isDuo = false, format = 'story', rankingType = 'jogadores', duoPlayers = []) {
  await waitForFonts();
  return new Promise((resolve) => {
    const w = 1080;
    // For 'ambos' mode, make the card taller to fit both sections
    const isBoth = rankingType === 'ambos';
    const h = format === 'story' ? 1920 : (isBoth ? 1350 : 1080);
    const { canvas, ctx } = createBaseCanvas(w, h);

    const title = rankingType === 'duplas' ? 'RANKING DUPLAS' : rankingType === 'ambos' ? 'RANKING DO DIA' : 'RANKING JOGADORES';
    ctx.fillStyle = '#C6FF00';
    ctx.font = '900 50px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, 280);

    // --- DRAW A PODIUM SECTION ---
    // startY = the top of the section (where the label goes)
    // Avatars are drawn below the label
    const drawPodiumSection = (items, startY, sectionIsDuo, sectionLabel) => {
      let podiumTop = startY;
      
      // Draw section label above the podium
      if (sectionLabel && isBoth) {
        ctx.fillStyle = sectionIsDuo ? '#FF6B4A' : '#00F5FF';
        ctx.font = 'bold 30px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(sectionLabel, w / 2, startY);
        podiumTop = startY + 80; // leave room: label(30px) + gap(50px)
      }

      const p1 = items[0], p2 = items[1], p3 = items[2];

      const drawPodiumPlayer = (p, x, y, pos, color, radius) => {
        if (!p) return;
        const nameStr = sectionIsDuo ? p.name : p.player_name;
        const displayName = nameStr.length > 12 ? nameStr.substring(0, 12) + '…' : nameStr;

        if (sectionIsDuo && p.players) {
          drawAvatar(ctx, x - radius * 0.6, y, radius * 0.85, p.players[0], color);
          drawAvatar(ctx, x + radius * 0.6, y, radius * 0.85, p.players[1], color);
        } else {
          drawAvatar(ctx, x, y, radius, nameStr, color);
        }

        // Name — below the avatar
        ctx.fillStyle = 'white';
        ctx.font = '900 28px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(displayName, x, y + radius + 18);

        // Victories — below the name
        ctx.fillStyle = color;
        ctx.font = 'bold 20px "Outfit", sans-serif';
        ctx.fillText(`${p.wins} VITÓRIAS`, x, y + radius + 54);

        if (pos === 1) {
          ctx.font = '40px Arial';
          ctx.textBaseline = 'bottom';
          ctx.fillText('👑', x, y - radius - 10);
        }
      };

      // 1st place center Y = podiumTop + crown(50) + radius(70) = podiumTop + 120
      const firstY = podiumTop + 120;
      
      drawPodiumPlayer(p2, w / 2 - 280, firstY + 60, 2, '#00F5FF', 55);
      drawPodiumPlayer(p1, w / 2, firstY, 1, '#C6FF00', 70);
      drawPodiumPlayer(p3, w / 2 + 280, firstY + 90, 3, '#FFFFFF', 50);

      // Bottom of section = 3rd place Y + radius(50) + name(28) + gap + victories(20) + padding
      return firstY + 90 + 50 + 54 + 30; // ~firstY + 224
    };

    // --- DRAW LIST ITEMS ---
    const drawListItems = (items, startY, listIsDuo) => {
      const remaining = items.slice(3, 8);
      remaining.forEach((p, idx) => {
        const y = startY + (idx * 90);
        const nameStr = listIsDuo ? p.name : p.player_name;

        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.roundRect(100, y - 35, w - 200, 75, 16);
        ctx.fill();

        ctx.fillStyle = '#8E8E93';
        ctx.font = 'bold 28px "Outfit", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${idx + 4}º`, 140, y);

        ctx.fillStyle = 'white';
        ctx.fillText(nameStr.length > 18 ? nameStr.substring(0, 18) + '…' : nameStr, 210, y);

        ctx.fillStyle = '#00F5FF';
        ctx.textAlign = 'right';
        ctx.fillText(`${p.wins} V`, w - 140, y);
      });
      return startY + remaining.length * 90;
    };

    // --- RENDER BASED ON rankingType ---
    if (rankingType === 'ambos') {
      // Only top 3 for each — no list items in combined mode
      const afterPlayers = drawPodiumSection(players, 340, false, 'JOGADORES');
      
      // Separator line
      const sepY = afterPlayers + 20;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(150, sepY);
      ctx.lineTo(w - 150, sepY);
      ctx.stroke();
      
      // Duo section
      drawPodiumSection(duoPlayers, sepY + 30, true, 'DUPLAS');
    } else {
      const isD = rankingType === 'duplas';
      const data = isD ? duoPlayers : players;
      const podiumY = format === 'story' ? 380 : 400;
      const afterPodium = drawPodiumSection(data, podiumY, isD, null);
      if (format === 'story' && data.length > 3) {
        drawListItems(data, afterPodium + 40, isD);
      }
    }

    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
  });
}

export async function renderMatchResultCard(match, format = 'story') {
  await waitForFonts();
  return new Promise((resolve) => {
    const w = format === 'story' ? 1080 : 1080;
    const h = format === 'story' ? 1920 : 1080;
    const { canvas, ctx } = createBaseCanvas(w, h);

    ctx.fillStyle = '#FF8C00'; // court-orange
    ctx.font = '900 50px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RESULTADO DA PARTIDA', w / 2, 280);

    const matchCenterY = h / 2;

    // Winner Box (Top/Left depending on layout)
    ctx.fillStyle = 'rgba(198, 255, 0, 0.1)';
    ctx.strokeStyle = '#C6FF00';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(100, matchCenterY - 300, w - 200, 220, 30);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#C6FF00';
    ctx.font = '900 36px "Outfit", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('VENCEDORES', 140, matchCenterY - 260);

    ctx.fillStyle = 'white';
    ctx.font = 'black 60px "Outfit", sans-serif';
    ctx.fillText(`${match.winner_1} & ${match.winner_2}`, 140, matchCenterY - 200);

    ctx.fillStyle = '#C6FF00';
    ctx.font = 'black 100px "Outfit", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(match.sets_winner, w - 140, matchCenterY - 210);

    // VS Badge
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(w/2, matchCenterY - 40, 50, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.stroke();
    ctx.fillStyle = '#8E8E93';
    ctx.font = 'black 36px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VS', w/2, matchCenterY - 40);

    // Loser Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(100, matchCenterY + 20, w - 200, 220, 30);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#8E8E93';
    ctx.font = '900 36px "Outfit", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('DESAFIANTES', 140, matchCenterY + 60);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 50px "Outfit", sans-serif';
    ctx.fillText(`${match.loser_1} & ${match.loser_2}`, 140, matchCenterY + 120);

    ctx.fillStyle = '#8E8E93';
    ctx.font = 'black 80px "Outfit", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(match.sets_loser, w - 140, matchCenterY + 110);

    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
  });
}
