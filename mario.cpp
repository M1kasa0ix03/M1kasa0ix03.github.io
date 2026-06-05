#include <windows.h>
#include <conio.h>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

// ==================== 常量 ====================
const int SCREEN_W = 80;
const int SCREEN_H = 25;
const float GRAVITY = 0.06f;
const float JUMP_VEL = -1.4f;
const float MOVE_SPEED = 0.14f;
const int MAX_LIVES = 3;

// ==================== 颜色 ====================
enum ConsoleColor {
    CC_BLACK = 0, CC_DARKRED = 4, CC_DARKYELLOW = 6, CC_GRAY = 7,
    CC_GREEN = 10, CC_YELLOW = 14, CC_WHITE = 15
};

HANDLE hOut;

void setColor(int c) {
    SetConsoleTextAttribute(hOut, c);
}

void gotoxy(int x, int y) {
    COORD pos = { (SHORT)x, (SHORT)y };
    SetConsoleCursorPosition(hOut, pos);
}

void hideCursor() {
    CONSOLE_CURSOR_INFO ci;
    ci.bVisible = FALSE;
    ci.dwSize = 1;
    SetConsoleCursorInfo(hOut, &ci);
}

// ==================== 游戏数据 ====================
enum Tile { T_EMPTY, T_SOLID, T_QUESTION, T_PIPE, T_FLAG };

struct Enemy {
    float x, y;
    float vx;
    bool alive;
};

struct Particle {
    float x, y, vy;
    char ch;
    int color;
    int life;
};

vector<string> rawMap;
vector<vector<Tile>> tiles;
vector<Enemy> enemies;
vector<Particle> particles;
float marioX, marioY, marioVX, marioVY;
bool marioOnGround;
int lives, score;
int cameraX;
int startX, startY;
int flagX, flagY;
bool running;
bool won;
int mapW, mapH;

// ==================== 工具函数 ====================
bool isSolid(Tile t) {
    return t == T_SOLID || t == T_QUESTION || t == T_PIPE;
}

void addParticle(float x, float y, char ch, int color) {
    particles.push_back({ x, y, -0.6f, ch, color, 15 });
}

// ==================== 关卡加载 ====================
void loadLevel() {
    const char* level[] = {
        "                                                                                                                  ",
        "                                                                                                                  ",
        "        ?  ?  ?                                                                    ?                              ",
        "       #########                                                                  ###                             ",
        "                                                                                                                  ",
        "                  ?                                                                                               ",
        "                 ###                                                               ?                              ",
        "                                                                                  ###                             ",
        "     ?                                                    E                                                       ",
        "    ###                                                  ###                                              |       ",
        "                                                                                                          |       ",
        "              E                                                                                           |       ",
        "             ###                                              ?   ?   ?                                   |       ",
        "                                                             ###########                                  |       ",
        "                                                                                                          |       ",
        "                                                                                                          |       ",
        "                                                                                                          |       ",
        "  M                                                                                                       |       ",
        " ###################     #########     #########     #########     #########     #########     #############      ",
        " ###################     #########     #########     #########     #########     #########     #############      ",
    };

    int rows = sizeof(level) / sizeof(level[0]);
    mapH = rows;
    mapW = 0;
    rawMap.clear();
    for (int i = 0; i < rows; i++) {
        rawMap.push_back(level[i]);
        if ((int)rawMap[i].size() > mapW) mapW = rawMap[i].size();
    }
    for (int i = 0; i < rows; i++) {
        while ((int)rawMap[i].size() < mapW) rawMap[i] += ' ';
    }

    tiles.assign(mapH, vector<Tile>(mapW, T_EMPTY));
    enemies.clear();
    particles.clear();
    flagX = flagY = -1;

    for (int y = 0; y < mapH; y++) {
        for (int x = 0; x < mapW; x++) {
            char c = rawMap[y][x];
            switch (c) {
                case '#': tiles[y][x] = T_SOLID; break;
                case '?': tiles[y][x] = T_QUESTION; break;
                case 'P': tiles[y][x] = T_PIPE; break;
                case '|': tiles[y][x] = T_FLAG; flagX = x; flagY = y; break;
                case 'M': marioX = x; marioY = y; startX = x; startY = y; break;
                case 'E': enemies.push_back({ (float)x, (float)y, -0.10f, true }); break;
                default: tiles[y][x] = T_EMPTY; break;
            }
        }
    }

    marioVX = marioVY = 0;
    marioOnGround = false;
    lives = MAX_LIVES;
    score = 0;
    cameraX = 0;
    running = true;
    won = false;
}

// ==================== 碰撞检测 ====================
void resolveCollision(float& x, float& y, float& vx, float& vy, bool& onGround) {
    onGround = false;
    int top = (int)y;
    int bottom = (int)(y + 0.99f);

    // 水平碰撞
    if (vx != 0) {
        float nextX = x + vx;
        int nextLeft = (int)nextX;
        int nextRight = (int)(nextX + 0.99f);
        bool hit = false;
        if (vx > 0) {
            for (int ty = top; ty <= bottom && ty < mapH; ty++) {
                if (nextRight < mapW && isSolid(tiles[ty][nextRight])) { hit = true; break; }
            }
            if (hit) { x = nextRight - 1.0f; vx = 0; }
            else x = nextX;
        } else {
            for (int ty = top; ty <= bottom && ty < mapH; ty++) {
                if (nextLeft >= 0 && isSolid(tiles[ty][nextLeft])) { hit = true; break; }
            }
            if (hit) { x = nextLeft + 1.0f; vx = 0; }
            else x = nextX;
        }
    }

    // 垂直更新后的 top/bottom
    top = (int)y;
    bottom = (int)(y + 0.99f);

    if (vy != 0) {
        float nextY = y + vy;
        int nextTop = (int)nextY;
        int nextBottom = (int)(nextY + 0.99f);
        int left = (int)x;
        int right = (int)(x + 0.99f);

        if (vy > 0) { // 下落
            bool hit = false;
            for (int tx = left; tx <= right && tx < mapW; tx++) {
                if (nextBottom < mapH && isSolid(tiles[nextBottom][tx])) { hit = true; break; }
            }
            if (hit) {
                y = nextBottom - 1.0f;
                vy = 0;
                onGround = true;
            } else {
                y = nextY;
            }
        } else { // 上升
            bool hit = false;
            for (int tx = left; tx <= right && tx < mapW; tx++) {
                if (nextTop >= 0 && isSolid(tiles[nextTop][tx])) { hit = true; break; }
            }
            if (hit) {
                for (int tx = left; tx <= right && tx < mapW; tx++) {
                    if (tiles[nextTop][tx] == T_QUESTION) {
                        tiles[nextTop][tx] = T_SOLID;
                        score += 10;
                        addParticle(tx, nextTop - 1, 'o', CC_YELLOW);
                    }
                }
                y = nextTop + 1.0f;
                vy = 0;
            } else {
                y = nextY;
            }
        }
    } else {
        // 站在地上？
        int nextBottom = (int)(y + 1.0f);
        int left = (int)x;
        int right = (int)(x + 0.99f);
        bool standing = false;
        for (int tx = left; tx <= right && tx < mapW; tx++) {
            if (nextBottom < mapH && isSolid(tiles[nextBottom][tx])) { standing = true; break; }
        }
        onGround = standing;
    }

    if (x < 0) { x = 0; vx = 0; }
    if (x + 1 > mapW) { x = mapW - 1; vx = 0; }
    if (y < 0) { y = 0; vy = 0; }
    if (y + 1 > mapH) { y = mapH - 1; vy = 0; onGround = true; }
}

// ==================== 更新 ====================
void update() {
    if (!running || won) {
        if (_kbhit() && _getch() == 'r') loadLevel();
        return;
    }

    // 输入
    if (_kbhit()) {
        int key = _getch();
        if (key == 224) {
            if (_kbhit()) {
                int arrow = _getch();
                if (arrow == 75) marioVX = -MOVE_SPEED;
                else if (arrow == 77) marioVX = MOVE_SPEED;
                else if (arrow == 72 && marioOnGround) {
                    marioVY = JUMP_VEL;
                    marioOnGround = false;
                }
            }
        } else if (key == 'a' || key == 'A') marioVX = -MOVE_SPEED;
        else if (key == 'd' || key == 'D') marioVX = MOVE_SPEED;
        else if (key == ' ' && marioOnGround) {
            marioVY = JUMP_VEL;
            marioOnGround = false;
        }
    }

    // 物理
    marioVY += GRAVITY;
    marioVX *= 0.82f;
    resolveCollision(marioX, marioY, marioVX, marioVY, marioOnGround);

    // 敌人 AI
    for (auto& e : enemies) {
        if (!e.alive) continue;
        float nextX = e.x + e.vx;
        int checkX = (int)(nextX + (e.vx > 0 ? 1.0f : -0.1f));
        int checkY = (int)e.y;
        bool turn = false;
        if (checkX < 0 || checkX >= mapW) turn = true;
        else if (isSolid(tiles[checkY][checkX])) turn = true;
        else if (checkY + 1 < mapH && !isSolid(tiles[checkY + 1][checkX]) && tiles[checkY + 1][checkX] != T_FLAG) turn = true;

        if (turn) e.vx = -e.vx;
        else e.x = nextX;
    }

    // 马里奥 vs 敌人
    for (auto& e : enemies) {
        if (!e.alive) continue;
        bool overlapX = (marioX + 0.85f > e.x) && (marioX < e.x + 1.0f);
        bool overlapY = (marioY + 0.85f > e.y) && (marioY < e.y + 0.85f);
        if (overlapX && overlapY) {
            // 踩头判定：下落中且马里奥底部在敌人上半部分
            if (marioVY > 0 && marioY + 0.85f < e.y + 0.5f) {
                e.alive = false;
                marioVY = -0.9f;
                marioOnGround = false;
                score += 100;
                addParticle(e.x, e.y, '*', CC_YELLOW);
            } else {
                // 受伤
                lives--;
                if (lives <= 0) {
                    running = false;
                } else {
                    marioX = startX;
                    marioY = startY;
                    marioVX = marioVY = 0;
                }
                break;
            }
        }
    }

    // 到达旗杆
    if (flagX >= 0) {
        int mx = (int)(marioX + 0.5f);
        int my = (int)(marioY + 0.5f);
        if (mx == flagX && my >= flagY - 4 && my <= flagY + 2) {
            won = true;
            score += 1000;
        }
    }

    // 掉出地图
    if (marioY >= mapH - 1) {
        lives--;
        if (lives <= 0) running = false;
        else {
            marioX = startX; marioY = startY;
            marioVX = marioVY = 0;
        }
    }

    // 粒子
    for (int i = (int)particles.size() - 1; i >= 0; i--) {
        particles[i].y += particles[i].vy;
        particles[i].vy += GRAVITY;
        particles[i].life--;
        if (particles[i].life <= 0) particles.erase(particles.begin() + i);
    }

    // 相机
    cameraX = (int)(marioX - SCREEN_W / 2);
    if (cameraX < 0) cameraX = 0;
    if (cameraX > mapW - SCREEN_W) cameraX = mapW - SCREEN_W;
    if (mapW < SCREEN_W) cameraX = 0;
}

// ==================== 渲染 ====================
void render() {
    gotoxy(0, 0);
    for (int y = 0; y < SCREEN_H && y < mapH; y++) {
        for (int x = 0; x < SCREEN_W; x++) {
            int mx = x + cameraX;
            if (mx >= mapW) { cout << ' '; continue; }

            // 马里奥
            int mleft = (int)marioX;
            int mtop = (int)marioY;
            if (mleft == mx && mtop == y) {
                setColor(CC_DARKRED);
                cout << 'O';
                continue;
            }

            // 敌人
            bool drew = false;
            for (auto& e : enemies) {
                if (e.alive && (int)e.x == mx && (int)e.y == y) {
                    setColor(CC_DARKYELLOW);
                    cout << 'E';
                    drew = true; break;
                }
            }
            if (drew) continue;

            // 粒子
            for (auto& p : particles) {
                if ((int)p.x == mx && (int)p.y == y) {
                    setColor(p.color);
                    cout << p.ch;
                    drew = true; break;
                }
            }
            if (drew) continue;

            Tile t = tiles[y][mx];
            switch (t) {
                case T_SOLID:
                    setColor(CC_DARKYELLOW);
                    cout << '#';
                    break;
                case T_QUESTION:
                    setColor(CC_YELLOW);
                    cout << '?';
                    break;
                case T_PIPE:
                    setColor(CC_GREEN);
                    cout << 'P';
                    break;
                case T_FLAG:
                    setColor(CC_WHITE);
                    cout << '|';
                    break;
                default:
                    cout << ' ';
                    break;
            }
        }
        if (y < SCREEN_H - 1) cout << '\n';
    }

    // UI
    gotoxy(0, SCREEN_H);
    setColor(CC_WHITE);
    cout << "生命: " << lives << "  分数: " << score;
    if (won) {
        cout << "  \u3010过关！按 R 重玩\u3011      ";
    } else if (!running) {
        cout << "  \u3010游戏结束！按 R 重玩\u3011  ";
    } else {
        cout << "  [A/左 D/右 空格/上 跳跃]    ";
    }
}

// ==================== 主函数 ====================
int main() {
    hOut = GetStdHandle(STD_OUTPUT_HANDLE);
    hideCursor();

    // 尝试调整控制台大小（失败也无妨）
    COORD bufSize = { (SHORT)SCREEN_W, (SHORT)(SCREEN_H + 1) };
    SetConsoleScreenBufferSize(hOut, bufSize);
    SMALL_RECT rect = { 0, 0, (SHORT)(SCREEN_W - 1), (SHORT)SCREEN_H };
    SetConsoleWindowInfo(hOut, TRUE, &rect);

    loadLevel();

    while (true) {
        update();
        render();
        Sleep(30);
    }
    return 0;
}
