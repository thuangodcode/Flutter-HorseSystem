import type { ReactNode } from 'react'
import React from 'react'
import { SafeAreaView, StyleSheet, View } from 'react-native'

export function Screen(props: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>{props.children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 16, gap: 12 },
})
