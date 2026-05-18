import { Text } from 'react-native'
import { Screen } from '../components/Screen'

export function AdminSchedulingScreen() {
  return (
    <Screen>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Tournament & Scheduling (Admin)</Text>
      <Text>• Quản lý thông tin giải đấu</Text>
      <Text>• Lập lịch thi đấu chung</Text>
      <Text>• Sắp xếp cuộc đua & vòng đua</Text>
      <Text>• Duyệt đăng ký tham gia</Text>
      <Text>• Phân công trọng tài</Text>
      <Text>• Công bố kết quả & tiền thưởng</Text>
      <Text style={{ color: '#666' }}>Placeholder để sau này gắn BE.</Text>
    </Screen>
  )
}
