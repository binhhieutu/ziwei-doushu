import labels from './labels.json';

/** Display only: chart identifiers and upstream lookup tables remain unchanged. */
export const VI_STEMS = [
  'Giáp',
  'Ất',
  'Bính',
  'Đinh',
  'Mậu',
  'Kỷ',
  'Canh',
  'Tân',
  'Nhâm',
  'Quý',
] as const;
export const VI_BRANCHES = [
  'Tý',
  'Sửu',
  'Dần',
  'Mão',
  'Thìn',
  'Tỵ',
  'Ngọ',
  'Mùi',
  'Thân',
  'Dậu',
  'Tuất',
  'Hợi',
] as const;
const STEMS = '甲乙丙丁戊己庚辛壬癸';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';

export function viLabel(value: string): string {
  return Object.prototype.hasOwnProperty.call(labels, value)
    ? (labels as Record<string, string>)[value]
    : value;
}

export function canChiLabel(value: string): string {
  return [...value]
    .map((char) => {
      const stem = STEMS.indexOf(char);
      const branch = BRANCHES.indexOf(char);
      return stem >= 0
        ? VI_STEMS[stem]
        : branch >= 0
          ? VI_BRANCHES[branch]
          : char;
    })
    .join(' ')
    .trim();
}

export interface GuideEntry {
  id: string;
  key: string;
  name: string;
  description: string;
}

/** Original introductory copy for this fork; not quotations from course transcripts. */
export const STAR_GUIDE: readonly GuideEntry[] = [
  {
    id: 'tu-vi',
    key: '紫微',
    name: 'Tử Vi',
    description:
      'Biểu tượng về khả năng tổ chức, trách nhiệm và nhu cầu tự chủ. Khi đọc cần xem cung an sao, các sao đi cùng và thế tam phương; một mình Tử Vi không quyết định toàn bộ cuộc đời.',
  },
  {
    id: 'thien-co',
    key: '天机',
    name: 'Thiên Cơ',
    description:
      'Gợi chủ đề suy nghĩ, lập kế hoạch, học hỏi và thích nghi. Điểm đáng quan sát là cách biến ý tưởng thành việc làm, cũng như sự cân bằng giữa linh hoạt và thay đổi liên tục.',
  },
  {
    id: 'thai-duong',
    key: '太阳',
    name: 'Thái Dương',
    description:
      'Thường được liên hệ với sự thể hiện ra bên ngoài, tinh thần đóng góp và trách nhiệm. Vị trí, độ sáng và các sao hội chiếu giúp đặt ý nghĩa ấy vào bối cảnh cụ thể.',
  },
  {
    id: 'vu-khuc',
    key: '武曲',
    name: 'Vũ Khúc',
    description:
      'Gắn với tính thực tế, sự quyết đoán và cách quản lý nguồn lực. Luận giải nên xem thêm Tài Bạch, Quan Lộc và hoàn cảnh thực tế, thay vì suy ra số tiền hay kết quả đầu tư.',
  },
  {
    id: 'thien-dong',
    key: '天同',
    name: 'Thiên Đồng',
    description:
      'Gợi khuynh hướng hòa nhã, coi trọng cảm xúc và chất lượng sống. Cần đọc cùng các sao khác để phân biệt sự mềm dẻo hữu ích với việc né tránh thay đổi cần thiết.',
  },
  {
    id: 'liem-trinh',
    key: '廉贞',
    name: 'Liêm Trinh',
    description:
      'Chủ đề thường gặp là nguyên tắc, ranh giới, sức hút và cách thể hiện cá tính. Không nên gán một tính cách tốt hoặc xấu chỉ từ tên sao; bối cảnh cả cung mới có ý nghĩa.',
  },
  {
    id: 'thien-phu',
    key: '天府',
    name: 'Thiên Phủ',
    description:
      'Thường gắn với sự gìn giữ, ổn định và tổ chức nguồn lực. Khi đứng trong một cung, sao này là điểm bắt đầu để tìm hiểu cách quản trị, không phải cam kết về mức độ giàu có.',
  },
  {
    id: 'thai-am',
    key: '太阴',
    name: 'Thái Âm',
    description:
      'Gợi chiều sâu nội tâm, sự quan sát và nhu cầu an toàn. Cách đọc truyền thống còn xét độ sáng và các sao cùng cung; không thể dùng riêng sao này để kết luận về một người.',
  },
  {
    id: 'tham-lang',
    key: '贪狼',
    name: 'Tham Lang',
    description:
      'Liên quan đến khám phá, giao tiếp, sở thích và động lực trải nghiệm. Câu hỏi hữu ích là những nguồn lực ấy được dùng vào đâu và có được điều tiết phù hợp với hoàn cảnh hay không.',
  },
  {
    id: 'cu-mon',
    key: '巨门',
    name: 'Cự Môn',
    description:
      'Gợi chủ đề ngôn ngữ, tranh luận và năng lực phân tích. Có thể dùng như một gợi ý tự suy xét về cách diễn đạt, lắng nghe và xử lý bất đồng trong giao tiếp.',
  },
  {
    id: 'thien-tuong',
    key: '天相',
    name: 'Thiên Tướng',
    description:
      'Thường được đọc qua vai trò hỗ trợ, phối hợp và giữ cân bằng. Ý nghĩa cụ thể tùy vào cung, sao đi cùng và cách một người thực sự đảm nhận trách nhiệm.',
  },
  {
    id: 'thien-luong',
    key: '天梁',
    name: 'Thiên Lương',
    description:
      'Gắn với sự che chở, kinh nghiệm và ý thức về nguyên tắc. Đây là ngôn ngữ biểu tượng của Tử Vi, không phải bằng chứng về tuổi thọ hoặc tình trạng sức khỏe.',
  },
  {
    id: 'that-sat',
    key: '七杀',
    name: 'Thất Sát',
    description:
      'Gợi tinh thần quyết liệt, độc lập và ứng phó với áp lực. Cần xem môi trường, sự hỗ trợ và các sao hội chiếu để đọc cân bằng cả khả năng hành động lẫn điều cần tiết chế.',
  },
  {
    id: 'pha-quan',
    key: '破军',
    name: 'Phá Quân',
    description:
      'Chủ đề nổi bật là thay đổi, thử nghiệm và tái tổ chức. Không có nghĩa mọi thay đổi đều bất lợi; luận giải cần xem mục tiêu, khả năng thích nghi và toàn bộ lá số.',
  },
];

export const PALACE_GUIDE: readonly GuideEntry[] = [
  {
    id: 'menh',
    key: '命宫',
    name: 'Mệnh',
    description:
      'Góc nhìn tổng quát về cách thể hiện bản thân và ứng xử. Đọc cùng Thân, tam phương tứ chính và hoàn cảnh sống; một cung không đại diện cho toàn bộ con người.',
  },
  {
    id: 'huynh-de',
    key: '兄弟',
    name: 'Huynh Đệ',
    description:
      'Chủ đề anh chị em và một phần quan hệ đồng hành gần gũi. Không dùng cung này để khẳng định chính xác số người, tính cách hoặc sự kiện của người thân.',
  },
  {
    id: 'phu-the',
    key: '夫妻',
    name: 'Phu Thê',
    description:
      'Tìm hiểu cách hình thành quan hệ gắn bó và những kỳ vọng trong đời sống đôi lứa. Các diễn giải là gợi ý suy xét, không định trước kết quả hôn nhân.',
  },
  {
    id: 'tu-tuc',
    key: '子女',
    name: 'Tử Tức',
    description:
      'Chủ đề quan hệ chăm sóc, con cái và trách nhiệm nuôi dưỡng. Không suy ra khả năng sinh sản, giới tính hoặc số lượng con từ dữ kiện Tử Vi.',
  },
  {
    id: 'tai-bach',
    key: '财帛',
    name: 'Tài Bạch',
    description:
      'Góc nhìn về cách tạo lập và sử dụng nguồn lực. Nên liên hệ với kỹ năng, công việc và thói quen thực tế; lá số không cung cấp dự báo lợi nhuận.',
  },
  {
    id: 'tat-ach',
    key: '疾厄',
    name: 'Tật Ách',
    description:
      'Một chủ đề truyền thống về thể chất và nếp sống. Có thể dùng để gợi ý tự chăm sóc ở mức chung, không chẩn đoán bệnh hay thay thế tư vấn y tế.',
  },
  {
    id: 'thien-di',
    key: '迁移',
    name: 'Thiên Di',
    description:
      'Cách tương tác với môi trường bên ngoài, thay đổi chỗ ở hoặc mở rộng trải nghiệm. Cần đối chiếu điều kiện thực tế trước các lựa chọn di chuyển.',
  },
  {
    id: 'no-boc',
    key: '仆役',
    name: 'Nô Bộc',
    description:
      'Chủ đề bạn bè, cộng sự và mạng lưới hợp tác. Cách đọc hữu ích là nhìn lại ranh giới, niềm tin và cách phối hợp, không gán phẩm chất cho người chưa biết.',
  },
  {
    id: 'quan-loc',
    key: '官禄',
    name: 'Quan Lộc',
    description:
      'Cách tham gia công việc và vai trò xã hội. Luận giải nên đặt cạnh năng lực, cơ hội và mục tiêu nghề nghiệp; không khẳng định một nghề nghiệp duy nhất.',
  },
  {
    id: 'dien-trach',
    key: '田宅',
    name: 'Điền Trạch',
    description:
      'Chủ đề không gian sống, nền tảng ổn định và quan hệ với tài sản. Không dùng riêng cung này để kết luận quyền sở hữu, giá trị bất động sản hoặc tranh chấp.',
  },
  {
    id: 'phuc-duc',
    key: '福德',
    name: 'Phúc Đức',
    description:
      'Góc nhìn truyền thống về đời sống tinh thần, nguồn nâng đỡ và sự kết nối. Có thể đọc như một gợi ý xây dựng nếp sống và quan hệ có ý nghĩa.',
  },
  {
    id: 'phu-mau',
    key: '父母',
    name: 'Phụ Mẫu',
    description:
      'Chủ đề quan hệ với cha mẹ, người nuôi dưỡng và những ảnh hưởng ban đầu. Không suy diễn tuổi thọ, bệnh tật hoặc sự kiện chắc chắn của người thân.',
  },
];
