import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const testerEmail = process.env.TESTER_EMAIL ?? "tester@example.com";
const testerPassword = process.env.TESTER_PASSWORD ?? "tester1234!";

async function main() {
  const passwordHash = await bcrypt.hash(testerPassword, 12);

  await prisma.user.upsert({
    where: { email: testerEmail },
    update: {
      passwordHash,
      role: "tester",
    },
    create: {
      email: testerEmail,
      passwordHash,
      role: "tester",
    },
  });

  await prisma.project.deleteMany();

  const project = await prisma.project.create({
    data: {
      title: "안개 기록 보관소",
      description:
        "항구 도시의 오래된 기록 보관소에서 사라진 항해 일지를 찾는 인물들의 미스터리 원고.",
      genre: "미스터리 판타지",
      targetAudience: "서사 구조를 점검하려는 장편 작가",
      characterConcepts: {
        create: [
          {
            name: "서윤",
            role: "protagonist",
            status: "planned",
            tagsJson: JSON.stringify(["기록 탐색자", "의심", "숨은 당사자"]),
            logline: "사건 바깥에 있다고 믿지만, 기록 속에 이미 이름이 남아 있는 조사자.",
            description: "조용하고 관찰력이 강한 인물. 단서를 성급히 믿지 않지만 자기 이름이 사건 안에 들어오면 흔들린다.",
            appearance: "비에 젖은 코트, 낡은 수첩, 작은 열쇠고리를 지닌다.",
            voice: "짧고 확인하는 문장. 감정보다 사실을 먼저 말한다.",
            goal: "도윤이 남긴 마지막 페이지를 찾아 사건의 원인을 확인한다.",
            motivation: "기록이 사람의 존재를 지운다는 두려움을 멈추고 싶다.",
            desire: "사건의 바깥에서 객관적인 조사자로 남고 싶다.",
            fear: "자신도 이미 조작된 기록의 일부일지 모른다는 가능성.",
            wound: "과거에 잘못된 증언 때문에 누군가를 잃었다.",
            secret: "어린 시절 보관소에서 사라진 하루를 기억하지 못한다.",
            strength: "작은 모순과 반복되는 문장을 놓치지 않는다.",
            weakness: "혼자 판단하려는 습관 때문에 협력 타이밍을 놓친다.",
            conflict: "진실을 밝히려는 목표와 자기 이름을 지키려는 본능이 충돌한다.",
            relationshipNotes: "해림을 필요로 하지만 해림의 직감을 쉽게 믿지 않는다. 도윤에게는 죄책감과 의심을 동시에 품는다.",
            backstory: "항구 도시의 기록 복원 일을 맡으며 오래된 문서의 삭제 흔적을 추적해 왔다.",
            arcStart: "객관적 조사자라고 믿으며 사건에 진입한다.",
            arcTurningPoint: "등대 명부에서 자신의 이름을 발견한다.",
            arcEnd: "기록을 피하지 않고 자기 이름을 걸고 마지막 페이지를 연다.",
            plotFunction: "독자가 사건을 따라가는 시점 인물이자 기록 조작의 핵심 단서.",
          },
          {
            name: "해림",
            role: "ally",
            status: "planned",
            tagsJson: JSON.stringify(["직감형 조력자", "등대", "빠른 결론"]),
            logline: "지도에 없는 등대를 믿는 조력자이지만, 빠른 확신이 갈등을 만든다.",
            desire: "사라진 등대와 도윤의 흔적이 연결되어 있음을 증명한다.",
            weakness: "직감이 맞는 순간에도 근거를 설명하지 못한다.",
            conflict: "서윤의 의심과 자신의 확신 사이에서 계속 부딪힌다.",
            relationshipNotes: "서윤에게 단서를 제공하지만, 신뢰를 얻기 전까지는 위험한 안내자처럼 보인다.",
            arcStart: "확신만으로 움직인다.",
            arcTurningPoint: "명부에서 서윤의 이름을 보고 자신의 판단도 부족했음을 깨닫는다.",
            arcEnd: "직감과 근거를 함께 제시하는 조력자로 변화한다.",
            plotFunction: "서윤을 보관소 밖의 폐쇄 구역으로 밀어내는 추진력.",
          },
        ],
      },
      manuscripts: {
        create: [
          {
            chapterNumber: 1,
            title: "닫힌 보관소의 밤",
            body: `서윤은 비가 멈춘 항구 역에서 오래된 열쇠를 받았다. 열쇠를 건넨 해림은 기록 보관소의 문이 삼일째 열리지 않는다고 말했다. 평소라면 관리인 도윤이 먼저 불을 켰겠지만, 그날 밤 보관소 창문에는 푸른 신호만 흔들렸다.

서윤은 도윤의 책상에서 항해 일지의 빈 표지를 발견했다. 표지 안쪽에는 누군가가 지운 지도 조각이 남아 있었다. 해림은 그 지도가 사라진 등대와 관련 있다고 믿었지만, 서윤은 너무 빨리 결론을 내리는 해림의 태도를 의심했다.

두 사람은 지하 서가로 내려갔다. 지하에는 바닷물이 들어온 흔적과 같은 문장이 반복된 기록 카드가 있었다. "안개가 걷히면 첫 이름을 지워라." 서윤은 그 문장이 도윤이 남긴 경고라고 생각했지만, 왜 같은 카드가 여러 곳에 꽂혀 있는지는 설명하지 못했다.`,
            memo: "도입부. 서윤, 해림, 도윤의 관계와 보관소 사건을 심는다.",
          },
          {
            chapterNumber: 2,
            title: "지도에 없는 등대",
            body: `다음 날 새벽, 서윤과 해림은 지도 조각을 따라 항구 끝의 폐쇄 구역으로 향했다. 폐쇄 구역에는 지도에 없는 등대가 있었고, 등대 벽에는 도윤의 필체와 닮은 숫자가 새겨져 있었다. 그래서 서윤은 도윤이 실종된 것이 아니라 일부러 흔적을 남겼다고 판단했다.

해림은 숫자를 조합해 등대 문을 열었다. 안쪽에서는 항해 일지의 본문이 아니라 여러 사람의 이름이 적힌 명부가 나왔다. 명부 맨 아래에는 서윤의 이름도 있었다. 서윤은 자신이 사건 바깥의 조사자가 아니라 오래전부터 기록된 당사자라는 사실을 깨달았다.

바람이 거세지자 등대의 렌즈가 항구 보관소를 비추었다. 그 순간 보관소 지붕에서 푸른 신호가 다시 켜졌다. 해림은 돌아가야 한다고 말했지만, 서윤은 먼저 도윤이 숨긴 마지막 페이지를 찾아야 한다고 결심했다.`,
            memo: "발단에서 반전으로 이동. 서윤의 당사자성을 드러낸다.",
          },
        ],
      },
    },
  });

  console.log(`Seeded sample project: ${project.title}`);
  console.log(`Seeded tester account: ${testerEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
