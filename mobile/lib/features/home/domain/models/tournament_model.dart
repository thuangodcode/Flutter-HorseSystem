// ============================================================================
// CORE ENTITIES - HORSE RACING TOURNAMENT MANAGEMENT SYSTEM (SU26SWP03 / WDP391)
// ============================================================================

/// 1. Tác nhân: Chủ ngựa (Horse Owner)
class HorseOwner {
  final String id;
  final String name;
  final String email;
  final String phone;
  final List<String> ownedHorseIds;
  final int totalWinnings;

  HorseOwner({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.ownedHorseIds,
    required this.totalWinnings,
  });
}

/// 2. Tác nhân: Kỵ sĩ (Jockey)
class Jockey {
  final String id;
  final String name;
  final String code; // Ví dụ: J-098
  final String nationality;
  final int winRate; // % thắng cuộc
  final String status; // "Available", "Busy", "Suspended"

  Jockey({
    required this.id,
    required this.name,
    required this.code,
    required this.nationality,
    required this.winRate,
    this.status = "Available",
  });
}

/// 3. Thực thể: Ngựa đua (Horse)
class Horse {
  final String id;
  final String name;
  final String code; // Ví dụ: H-09
  final int age;
  final String ownerId;
  final String ownerName;
  final Jockey jockey;
  final String status; // "Active", "Injured", "Retired"
  
  // Các trường phục vụ giả lập đua thời gian thực (Live simulation)
  double liveProgress; // Tiến độ chạy (0.0 đến 1.0)
  int livePosition;    // Thứ hạng trực tiếp (1, 2, 3...)

  Horse({
    required this.id,
    required this.name,
    required this.code,
    required this.age,
    required this.ownerId,
    required this.ownerName,
    required this.jockey,
    this.status = "Active",
    this.liveProgress = 0.0,
    this.livePosition = 1,
  });
}

/// 4. Thực thể: Giải đấu (Tournament)
class Tournament {
  final String id;
  final String title;
  final String date;
  final String location;
  final String prizePool;
  final String status; // "Live", "Upcoming", "Completed"
  final List<Race> races;

  Tournament({
    required this.id,
    required this.title,
    required this.date,
    required this.location,
    required this.prizePool,
    required this.status,
    required this.races,
  });
}

/// 5. Thực thể: Cuộc đua / Vòng đua (Race)
class Race {
  final String id;
  final String name; // Ví dụ: Grand Cup Final, Sprint Championship
  final String time;
  final String distance; // Ví dụ: 1200m, 1600m
  final List<Horse> horses;
  final String status; // "Pending", "Running", "Completed"
  final String? winnerId;

  Race({
    required this.id,
    required this.name,
    required this.time,
    required this.distance,
    required this.horses,
    required this.status,
    this.winnerId,
  });
}

/// 6. Thực thể: Đăng ký thi đấu (Registration)
class Registration {
  final String id;
  final String horseId;
  final String horseName;
  final String tournamentId;
  final String tournamentTitle;
  final String registrationDate;
  final String status; // "Pending", "Approved", "Rejected"

  Registration({
    required this.id,
    required this.horseId,
    required this.horseName,
    required this.tournamentId,
    required this.tournamentTitle,
    required this.registrationDate,
    required this.status,
  });
}

/// 7. Thực thể: Kết quả cuộc đua (Race Result)
class RaceResult {
  final String id;
  final String raceId;
  final String raceName;
  final String winningHorseId;
  final String winningHorseName;
  final String winningJockeyName;
  final String completionTime; // Ví dụ: 1m 12s 45ms
  final List<String> standingsList; // Danh sách thứ tự mã ngựa về đích

  RaceResult({
    required this.id,
    required this.raceId,
    required this.raceName,
    required this.winningHorseId,
    required this.winningHorseName,
    required this.winningJockeyName,
    required this.completionTime,
    required this.standingsList,
  });
}

/// 8. Thực thể: Đặt cược / Dự đoán (Bet / Prediction)
class Prediction {
  final String id;
  final String raceId;
  final String raceName;
  final String tournamentName;
  final Horse predictedHorse;
  final int betPoints;
  final String status; // "Pending", "Won", "Lost"
  final int? wonPoints;

  Prediction({
    required this.id,
    required this.raceId,
    required this.raceName,
    required this.tournamentName,
    required this.predictedHorse,
    required this.betPoints,
    required this.status,
    this.wonPoints,
  });
}

/// 9. Thực thể: Tiền thưởng / Điểm thưởng (Prize)
class Prize {
  final String id;
  final String recipientId; // Có thể là Owner, Jockey, hoặc Spectator
  final String recipientRole; // "Owner", "Jockey", "Spectator"
  final String sourceEvent; // Ví dụ: "Race Win", "Prediction Win"
  final int amount; // Số tiền hoặc số điểm thưởng
  final String status; // "Pending", "Distributed"

  Prize({
    required this.id,
    required this.recipientId,
    required this.recipientRole,
    required this.sourceEvent,
    required this.amount,
    required this.status,
  });
}

/// 10. Thực thể: Biên bản thi đấu của Trọng tài (Referee Report)
class RefereeReport {
  final String id;
  final String raceId;
  final String refereeName;
  final String checkStatus; // "All Passed", "Issues Found"
  final List<String> violationsRecorded; // Danh sách ghi nhận vi phạm của ngựa/jockey
  final String notes;

  RefereeReport({
    required this.id,
    required this.raceId,
    required this.refereeName,
    required this.checkStatus,
    required this.violationsRecorded,
    required this.notes,
  });
}
